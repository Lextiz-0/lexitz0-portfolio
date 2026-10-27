document.documentElement.classList.add("js");

const skills = [
  { icon: "globe", title: "Desarrollo web", text: "Sitios y aplicaciones web con HTML, CSS, JavaScript, React y Next.js." },
  { icon: "terminal", title: "Python", text: "Scripts, automatizaciones, APIs con FastAPI, análisis de datos y herramientas internas." },
  { icon: "gamepad-2", title: "Roblox y Luau", text: "Sistemas de juego, interfaces, economía, misiones, guardado de datos y herramientas de desarrollo." },
  { icon: "database", title: "Bases de datos", text: "Modelado de datos, SQL, PostgreSQL, Supabase, migraciones y consultas." },
  { icon: "workflow", title: "Automatización", text: "Flujos que reducen trabajo repetitivo: reportes, respaldos, integraciones y bots." },
  { icon: "bot", title: "Inteligencia artificial", text: "Integración de modelos de IA para asistentes, generación de contenido, análisis y productividad." },
  { icon: "chart-no-axes-combined", title: "Datos y métricas", text: "Dashboards, gráficas, KPIs y análisis para tomar mejores decisiones." },
  { icon: "git-branch", title: "Git y GitHub", text: "Control de versiones, ramas, pull requests, revisiones de código y colaboración." },
  { icon: "rocket", title: "Despliegue", text: "Publicación de aplicaciones e integración continua para que cada cambio llegue a producción solo." },
];

const STATUS = {
  "Terminado": { cls: "done", label: "Terminado" },
  "En desarrollo": { cls: "wip", label: "En desarrollo" },
  "Planeado": { cls: "plan", label: "Planeado" },
};

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isIconName = (v) => typeof v === "string" && /^[a-z0-9-]+$/.test(v);
const renderIcons = () => window.lucide && window.lucide.createIcons();

/* Tema claro / oscuro */
$("#themeToggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  if (chart) styleChart();
});

/* Navegación con borde al hacer scroll */
const nav = $(".nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), { passive: true });

/* Habilidades */
$("#skills-grid").innerHTML = skills
  .map((s, i) => `
    <article class="skill reveal">
      <div class="skill-top">
        <span class="skill-icon"><i data-lucide="${s.icon}" aria-hidden="true"></i></span>
        <span class="skill-n mono">${String(i + 1).padStart(2, "0")}</span>
      </div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </article>`)
  .join("");

/* Proyectos */
let projects = [];
let newFiles = new Set();
let chart;

function projectCard(p) {
  const st = STATUS[p.status] || { cls: "plan", label: p.status };
  const icon = isIconName(p.icon) ? p.icon : "folder-git-2";
  const isNew = newFiles.has(`projects/${p.id}.json`);
  const links = [
    p.url && `<a href="${esc(p.url)}" target="_blank" rel="noopener"><i data-lucide="external-link" aria-hidden="true"></i>Ver demo</a>`,
    p.repo && `<a href="${esc(p.repo)}" target="_blank" rel="noopener"><i data-lucide="code-xml" aria-hidden="true"></i>Código</a>`,
  ].filter(Boolean).join("");
  return `
    <article class="project">
      <div class="project-top">
        <span class="project-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>
        <span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
          ${isNew ? `<span class="badge new">Nuevo</span>` : ""}
          <span class="badge ${st.cls}">${esc(st.label)}</span>
        </span>
      </div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      <ul class="tags">${(p.tech || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      ${links ? `<div class="project-links">${links}</div>` : ""}
    </article>`;
}

function renderProjects(filter = "all") {
  const list = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  $("#projects-grid").innerHTML = list.length
    ? list.map(projectCard).join("")
    : `<p class="empty">No hay proyectos con este estado todavía.</p>`;
  renderIcons();
}

$("#filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll(".chip").forEach((c) => {
    const on = c === btn;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", on);
  });
  renderProjects(btn.dataset.filter);
});

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function styleChart() {
  const ds = chart.data.datasets[0];
  ds.backgroundColor = cssVar("--accent");
  chart.options.scales.x.ticks.color = cssVar("--muted");
  chart.options.scales.y.ticks.color = cssVar("--text");
  chart.options.scales.x.grid.color = cssVar("--border");
  chart.update();
}

function renderChart() {
  if (!window.Chart) return;
  const byTech = {};
  projects.forEach((p) => (p.tech || []).forEach((t) => (byTech[t] = (byTech[t] || 0) + 1)));
  const entries = Object.entries(byTech).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  Chart.defaults.font.family = cssVar("--font-body");
  chart = new Chart($("#projectsChart"), {
    type: "bar",
    data: {
      labels: entries.map((e) => e[0]),
      datasets: [{ label: "Proyectos", data: entries.map((e) => e[1]), borderRadius: 6, barThickness: 14 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw} proyecto${c.raw === 1 ? "" : "s"}` } } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#333" }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false } },
      },
    },
  });
  styleChart();
}

function renderStats() {
  const tech = new Set(projects.flatMap((p) => p.tech || []));
  const set = (k, v) => ($(`[data-stat="${k}"]`).textContent = v);
  set("total", projects.length);
  set("done", projects.filter((p) => p.status === "Terminado").length);
  set("wip", projects.filter((p) => p.status === "En desarrollo").length);
  set("tech", tech.size);
}

/* Información del último despliegue */
function timeAgo(iso) {
  const diff = (new Date(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return "hace un momento";
}

function renderDeploy(info) {
  const commit = info.runUrl
    ? `<a href="${esc(info.runUrl)}" target="_blank" rel="noopener">${esc(info.commit)}${info.run ? ` · #${esc(info.run)}` : ""}</a>`
    : esc(info.commit);
  const date = new Date(info.builtAt);
  $("#deployInfo").innerHTML = `
    <div><dt>estado</dt><dd><span class="status-dot"></span>en línea</dd></div>
    <div><dt>commit</dt><dd>${commit}</dd></div>
    <div><dt>mensaje</dt><dd title="${esc(info.message)}">${esc(info.message)}</dd></div>
    <div><dt>publicado</dt><dd title="${date.toLocaleString("es-MX")}">${timeAgo(info.builtAt)}</dd></div>`;

  const added = (info.added || []).slice(0, 4);
  const modified = (info.modified || []).slice(0, Math.max(0, 4 - added.length));
  if (added.length || modified.length) {
    const box = $("#deployFiles");
    box.hidden = false;
    box.innerHTML = `<p>archivos en este despliegue</p><ul>
      ${added.map((f) => `<li><b>+</b>${esc(f)}</li>`).join("")}
      ${modified.map((f) => `<li class="mod"><b>~</b>${esc(f)}</li>`).join("")}
    </ul>`;
  }
}

async function init() {
  try {
    const info = await fetch("build-info.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (info) {
      newFiles = new Set(info.added || []);
      renderDeploy(info);
    }
  } catch {}

  try {
    const res = await fetch("projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    projects = await res.json();
    renderProjects();
    renderStats();
    renderChart();
  } catch {
    $("#projects-grid").innerHTML = `<p class="empty">No se pudieron cargar los proyectos. Intenta recargar la página.</p>`;
  }
}

$("#year").textContent = new Date().getFullYear();
renderIcons();
init();

/* Aparición suave al hacer scroll */
const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
