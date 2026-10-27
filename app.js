document.documentElement.classList.add("js");

const skills = [
  { icon: "globe", title: "Desarrollo web", text: "Sitios y aplicaciones web rápidas con HTML, CSS, JavaScript, React y Next.js." },
  { icon: "terminal", title: "Python", text: "Scripts, automatizaciones, APIs con FastAPI y análisis de datos." },
  { icon: "gamepad-2", title: "Roblox y Luau", text: "Sistemas de juego, interfaces, economía, misiones y guardado de datos." },
  { icon: "database", title: "Bases de datos", text: "Diseño de datos con SQL, PostgreSQL y Supabase." },
  { icon: "workflow", title: "Automatización", text: "Flujos que ahorran trabajo repetitivo: reportes, respaldos, integraciones y bots." },
  { icon: "bot", title: "Inteligencia artificial", text: "Asistentes, generación de contenido y análisis con modelos de IA." },
  { icon: "chart-no-axes-combined", title: "Datos y métricas", text: "Paneles, gráficas e indicadores para tomar mejores decisiones." },
  { icon: "git-branch", title: "Git y GitHub", text: "Control de versiones, revisiones de código y trabajo en equipo." },
  { icon: "rocket", title: "Publicación", text: "Pongo tus proyectos en línea y hago que se actualicen solos." },
];

const STATUS = {
  "Terminado": { cls: "done", label: "Terminado" },
  "En desarrollo": { cls: "wip", label: "En desarrollo" },
  "Planeado": { cls: "plan", label: "Planeado" },
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isIconName = (v) => typeof v === "string" && /^[a-z0-9-]+$/.test(v);
const renderIcons = () => window.lucide && window.lucide.createIcons();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Tema claro / oscuro ---------- */
const themeBtn = $("#themeToggle");
function syncThemeUI() {
  const light = document.documentElement.dataset.theme === "light";
  themeBtn.setAttribute("aria-checked", String(light));
  themeBtn.setAttribute("aria-label", light ? "Activar modo oscuro" : "Activar modo claro");
  $("#themeLabel").textContent = light ? "Claro" : "Oscuro";
  document.querySelector('meta[name="theme-color"]').setAttribute("content", light ? "#FFFFFF" : "#0A1020");
}
themeBtn.addEventListener("click", () => {
  const root = document.documentElement;
  root.classList.add("theme-anim");
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", root.dataset.theme);
  syncThemeUI();
  if (chart) styleChart();
  setTimeout(() => root.classList.remove("theme-anim"), 500);
});
syncThemeUI();

/* ---------- Navegación: borde, progreso y sección activa ---------- */
const nav = $("#nav");
const bar = $("#progress");
function onScroll() {
  nav.classList.toggle("scrolled", scrollY > 8);
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navLinks = $$(".nav-links a");
const sectionObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.dataset.section === e.target.id));
  }),
  { rootMargin: "-45% 0px -50% 0px" }
);
["skills", "projects", "process"].forEach((id) => sectionObserver.observe(document.getElementById(id)));

/* ---------- Habilidades ---------- */
$("#skills-grid").innerHTML = skills
  .map((s, i) => `
    <article class="skill reveal" style="--i:${i % 3}">
      <span class="skill-icon"><i data-lucide="${s.icon}" aria-hidden="true"></i></span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </article>`)
  .join("");

/* ---------- Proyectos ---------- */
let projects = [];
let newFiles = new Set();
let chart;
let currentFilter = "all";

const isNew = (p) => newFiles.has(`projects/${p.id}.json`);

function projectCard(p, i) {
  const st = STATUS[p.status] || { cls: "plan", label: p.status };
  const icon = isIconName(p.icon) ? p.icon : "folder-git-2";
  const links = [
    p.url && `<a href="${esc(p.url)}" target="_blank" rel="noopener"><i data-lucide="external-link" aria-hidden="true"></i>Ver demo</a>`,
    p.repo && `<a href="${esc(p.repo)}" target="_blank" rel="noopener"><i data-lucide="code-xml" aria-hidden="true"></i>Ver código</a>`,
  ].filter(Boolean).join("");
  return `
    <article class="project" style="--i:${i}">
      <div class="project-top">
        <span class="project-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>
        <span class="badges">
          ${isNew(p) ? `<span class="badge new">Nuevo</span>` : ""}
          <span class="badge ${st.cls}">${esc(st.label)}</span>
        </span>
      </div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      <ul class="tags" aria-label="Tecnologías">${(p.tech || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      ${links ? `<div class="project-links">${links}</div>` : ""}
    </article>`;
}

function renderProjects() {
  const list = currentFilter === "all" ? projects : projects.filter((p) => p.status === currentFilter);
  $("#projects-grid").innerHTML = list.length
    ? list.map(projectCard).join("")
    : `<div class="empty"><i data-lucide="inbox" aria-hidden="true"></i><strong>Aún no hay proyectos aquí</strong><span>Pronto agregaré proyectos con este estado.</span></div>`;
  renderIcons();
}

/* Efecto de luz que sigue al cursor en las tarjetas */
$("#projects-grid").addEventListener("pointermove", (e) => {
  const card = e.target.closest(".project");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - r.left}px`);
  card.style.setProperty("--my", `${e.clientY - r.top}px`);
});

/* Filtros con indicador deslizante */
const filters = $("#filters");
const pill = $(".filter-pill");
function movePill() {
  const active = filters.querySelector(".chip.is-active");
  if (!active) return;
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.height = `${active.offsetHeight}px`;
  pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
}
filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  $$(".chip").forEach((c) => {
    const on = c === btn;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", String(on));
  });
  currentFilter = btn.dataset.filter;
  movePill();
  renderProjects();
});
addEventListener("resize", movePill);
document.fonts && document.fonts.ready.then(movePill);
movePill();

function renderCounts() {
  $$("[data-count]").forEach((el) => {
    const k = el.dataset.count;
    el.textContent = k === "all" ? projects.length : projects.filter((p) => p.status === k).length;
  });
  movePill();
}

/* Gráfica */
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function styleChart() {
  chart.data.datasets[0].backgroundColor = cssVar("--accent");
  chart.data.datasets[0].hoverBackgroundColor = cssVar("--accent-text");
  chart.options.scales.x.ticks.color = cssVar("--faint");
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
      datasets: [{ label: "Proyectos", data: entries.map((e) => e[1]), borderRadius: 999, borderSkipped: false, barThickness: 12 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 1100, easing: "easeOutQuart", delay: (c) => c.dataIndex * 60 },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#0A1020", padding: 10, cornerRadius: 10, displayColors: false, callbacks: { label: (c) => `${c.raw} proyecto${c.raw === 1 ? "" : "s"}` } },
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#333" }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: 600 } } },
      },
    },
  });
  styleChart();
}

/* Contadores animados */
function countUp(el, to) {
  if (reduceMotion || to === 0) return (el.textContent = to);
  const start = performance.now();
  const dur = 1200;
  const step = (now) => {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderStats() {
  const values = {
    total: projects.length,
    done: projects.filter((p) => p.status === "Terminado").length,
    wip: projects.filter((p) => p.status === "En desarrollo").length,
    tech: new Set(projects.flatMap((p) => p.tech || [])).size,
  };
  const stats = $(".stats");
  const run = () => Object.entries(values).forEach(([k, v]) => countUp($(`[data-stat="${k}"]`), v));
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.3 });
  io.observe(stats);
}

/* ---------- Novedades ---------- */
function timeAgo(iso) {
  const diff = (new Date(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return "hace un momento";
}

function renderNews(info) {
  $("#lastUpdate").textContent = info?.builtAt ? `Actualizado ${timeAgo(info.builtAt)}` : "Lo más reciente";
  const recent = [...projects]
    .sort((a, b) => (isNew(b) - isNew(a)) || new Date(b.updated) - new Date(a.updated))
    .slice(0, 3);
  $("#newsList").innerHTML = recent.length
    ? recent.map((p, i) => {
        const st = STATUS[p.status] || { cls: "plan", label: p.status };
        const icon = isIconName(p.icon) ? p.icon : "folder-git-2";
        return `
          <li class="news-item" style="--i:${i}">
            <span class="ni-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>
            <span class="ni-body">
              <strong>${esc(p.name)}</strong>
              <span class="meta">${isNew(p) ? "Agregado" : "Actualizado"} ${p.updated ? timeAgo(p.updated) : ""}</span>
            </span>
            <span class="badge ${isNew(p) ? "new" : st.cls}">${isNew(p) ? "Nuevo" : esc(st.label)}</span>
          </li>`;
      }).join("")
    : `<li class="muted small">Pronto habrá novedades.</li>`;
  renderIcons();
}

/* ---------- Carga de datos ---------- */
async function init() {
  let info = null;
  try {
    const r = await fetch("build-info.json", { cache: "no-store" });
    if (r.ok) info = await r.json();
    newFiles = new Set(info?.added || []);
  } catch {}

  try {
    const res = await fetch("projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    projects = await res.json();
    renderProjects();
    renderCounts();
    renderStats();
    renderNews(info);
    const chartIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { renderChart(); chartIo.disconnect(); } }, { threshold: 0.2 });
    chartIo.observe($("#projectsChart"));
  } catch {
    $("#projects-grid").innerHTML = `<div class="empty"><i data-lucide="wifi-off" aria-hidden="true"></i><strong>No se pudieron cargar los proyectos</strong><span>Intenta recargar la página.</span></div>`;
    $("#newsList").innerHTML = `<li class="muted small">No se pudieron cargar las novedades.</li>`;
    $("#lastUpdate").textContent = "";
    renderIcons();
  }
}

$("#year").textContent = new Date().getFullYear();
renderIcons();
init();

/* ---------- Aparición al hacer scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
  { threshold: 0.12 }
);
$$(".reveal").forEach((el) => io.observe(el));
