// Compila el sitio en ./dist sin dependencias externas.
// - Detecta automáticamente cada archivo .json dentro de /projects y genera dist/projects.json
// - Copia los archivos estáticos y la carpeta /assets
// - Genera dist/build-info.json con datos del despliegue (commit, fecha, archivos nuevos)
// - Añade un hash a styles.css y app.js para que el navegador nunca muestre una versión vieja
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname, basename } from "node:path";
import { execSync } from "node:child_process";

// Fecha del último commit que tocó un archivo (o la fecha del archivo si no hay git)
const lastChange = (path) => {
  try {
    const d = execSync(`git log -1 --format=%cI -- "${path}"`, { encoding: "utf8" }).trim();
    if (d) return d;
  } catch {}
  return statSync(path).mtime.toISOString();
};

const ROOT = process.cwd();
const OUT = join(ROOT, "dist");
const STATIC_FILES = ["index.html", "styles.css", "i18n.js", "app.js"];
const REQUIRED = ["name", "description", "tech", "status"];
const STATUSES = ["Terminado", "En desarrollo", "Planeado"];

const errors = [];
const fail = (msg) => errors.push(msg);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1. Proyectos: un archivo por proyecto en /projects
const projectsDir = join(ROOT, "projects");
const projectFiles = existsSync(projectsDir)
  ? readdirSync(projectsDir).filter((f) => extname(f) === ".json").sort()
  : [];

const projects = [];
for (const file of projectFiles) {
  const path = join(projectsDir, file);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`projects/${file}: JSON inválido (${e.message})`);
    continue;
  }
  for (const key of REQUIRED) if (!(key in data)) fail(`projects/${file}: falta el campo "${key}"`);
  if (data.tech && !Array.isArray(data.tech)) fail(`projects/${file}: "tech" debe ser una lista`);
  if (data.status && !STATUSES.includes(data.status))
    console.warn(`::warning file=projects/${file}::Estado "${data.status}" no reconocido. Usa: ${STATUSES.join(", ")}`);
  projects.push({
    id: basename(file, ".json"),
    icon: "folder-git-2",
    updated: lastChange(path),
    ...data,
  });
}

// Orden: Terminado → En desarrollo → Planeado, luego por nombre
const rank = (s) => (STATUSES.includes(s) ? STATUSES.indexOf(s) : 99);
projects.sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name, "es"));

if (errors.length) {
  for (const e of errors) console.error(`::error::${e}`);
  console.error(`\nLa compilación falló con ${errors.length} error(es).`);
  process.exit(1);
}

writeFileSync(join(OUT, "projects.json"), JSON.stringify(projects, null, 2));

// 2. Archivos estáticos con hash para evitar caché vieja
const hashes = {};
for (const f of STATIC_FILES) {
  const content = readFileSync(join(ROOT, f));
  hashes[f] = createHash("sha256").update(content).digest("hex").slice(0, 10);
}
let html = readFileSync(join(ROOT, "index.html"), "utf8");
for (const f of STATIC_FILES.filter((f) => f !== "index.html")) {
  html = html.replace(new RegExp(`(href|src)="${f.replace(".", "\\.")}"`), `$1="${f}?v=${hashes[f]}"`);
  cpSync(join(ROOT, f), join(OUT, f));
}
writeFileSync(join(OUT, "index.html"), html);
if (existsSync(join(ROOT, "assets"))) cpSync(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true });

// 3. Información del despliegue (la llena GitHub Actions)
const list = (v) => (v || "").split("\n").map((s) => s.trim()).filter(Boolean);
const buildInfo = {
  builtAt: new Date().toISOString(),
  commit: (process.env.GITHUB_SHA || "local").slice(0, 7),
  message: (process.env.COMMIT_MESSAGE || "Compilación local").split("\n")[0],
  run: process.env.GITHUB_RUN_NUMBER || null,
  runUrl: process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  added: list(process.env.ADDED_FILES),
  modified: list(process.env.MODIFIED_FILES),
  projects: projects.length,
};
writeFileSync(join(OUT, "build-info.json"), JSON.stringify(buildInfo, null, 2));

console.log(`Sitio compilado en dist/ — ${projects.length} proyecto(s), ${buildInfo.added.length} archivo(s) nuevo(s).`);
