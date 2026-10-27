document.documentElement.classList.add("js");

/* ---------- Configuración de contacto ---------- */
const CONTACT = {
  whatsapp: "527223659578", // +52 722 365 9578
  email: "lextiz52@gmail.com",
};

const SKILL_ICONS = ["globe", "terminal", "gamepad-2", "database", "workflow", "bot", "chart-no-axes-combined", "git-branch", "rocket"];
const STATUS_CLS = { "Terminado": "done", "En desarrollo": "wip", "Planeado": "plan" };
const LANGS = Object.keys(window.I18N);

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isIconName = (v) => typeof v === "string" && /^[a-z0-9-]+$/.test(v);
const renderIcons = () => window.lucide && window.lucide.createIcons();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Idiomas ---------- */
let lang = LANGS.includes(document.documentElement.lang) ? document.documentElement.lang : "es";
const t = (key, vars) => {
  let v = window.I18N[lang][key] ?? window.I18N.es[key] ?? key;
  if (typeof v === "string" && vars) for (const [k, x] of Object.entries(vars)) v = v.replaceAll(`{${k}}`, x);
  return v;
};

function applyStaticTexts() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  $$("[data-i18n-attr]").forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(":");
    el.setAttribute(attr, t(key));
  });
  const steps = t("process.steps");
  $$("[data-step]").forEach((el) => (el.textContent = steps[el.dataset.step][el.dataset.part]));
  $("#benefits").innerHTML = t("contact.benefits").map((b) => `<li><span><i data-lucide="check" aria-hidden="true"></i></span>${esc(b)}</li>`).join("");
  $("#langCode").textContent = lang.toUpperCase();
}

const langBtn = $("#langBtn");
const langMenu = $("#langMenu");
function renderLangMenu() {
  langMenu.innerHTML = LANGS.map((l) =>
    `<li role="option" tabindex="-1" data-lang="${l}" aria-selected="${l === lang}">${esc(window.I18N[l]._name)}<span class="code">${l.toUpperCase()}</span></li>`
  ).join("");
}
function toggleLangMenu(open) {
  const willOpen = open ?? langMenu.hidden;
  langMenu.hidden = !willOpen;
  langBtn.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) (langMenu.querySelector('[aria-selected="true"]') || langMenu.firstElementChild).focus();
}
langBtn.addEventListener("click", () => toggleLangMenu());
langMenu.addEventListener("click", (e) => {
  const li = e.target.closest("[data-lang]");
  if (li) setLang(li.dataset.lang);
});
langMenu.addEventListener("keydown", (e) => {
  const items = [...langMenu.children];
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.activeElement.click(); }
  if (e.key === "Escape") { toggleLangMenu(false); langBtn.focus(); }
});
document.addEventListener("click", (e) => { if (!e.target.closest("#lang")) toggleLangMenu(false); });

function setLang(next) {
  lang = next;
  localStorage.setItem("lang", next);
  toggleLangMenu(false);
  langBtn.focus();
  renderAll();
}

/* ---------- Tema claro / oscuro ---------- */
const themeBtn = $("#themeToggle");
function syncThemeUI() {
  const light = document.documentElement.dataset.theme === "light";
  themeBtn.setAttribute("aria-checked", String(light));
  themeBtn.setAttribute("aria-label", t(light ? "theme.toDark" : "theme.toLight"));
  $("#themeLabel").textContent = t(light ? "theme.light" : "theme.dark");
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
["skills", "projects", "process", "contact"].forEach((id) => sectionObserver.observe(document.getElementById(id)));

/* ---------- Habilidades ---------- */
function renderSkills() {
  const grid = $("#skills-grid");
  const firstRender = !grid.children.length;
  grid.innerHTML = t("skills.items")
    .map(([title, text], i) => `
      <article class="skill ${firstRender ? "reveal" : ""}" style="--i:${i % 3}">
        <span class="skill-icon"><i data-lucide="${SKILL_ICONS[i]}" aria-hidden="true"></i></span>
        <h3>${esc(title)}</h3>
        <p>${esc(text)}</p>
      </article>`)
    .join("");
  if (firstRender) grid.querySelectorAll(".reveal").forEach((el) => revealIo.observe(el));
}

/* ---------- Proyectos ---------- */
let projects = [];
let buildInfo = null;
let newFiles = new Set();
let chart;
let currentFilter = "all";

const isNew = (p) => newFiles.has(`projects/${p.id}.json`);
const pName = (p) => p.translations?.[lang]?.name || p.name;
const pDesc = (p) => p.translations?.[lang]?.description || p.description;
const statusLabel = (s) => (STATUS_CLS[s] ? t(`status.${s}`) : s);

function projectCard(p, i) {
  const cls = STATUS_CLS[p.status] || "plan";
  const icon = isIconName(p.icon) ? p.icon : "folder-git-2";
  const links = [
    p.url && `<a href="${esc(p.url)}" target="_blank" rel="noopener"><i data-lucide="external-link" aria-hidden="true"></i>${esc(t("projects.demo"))}</a>`,
    p.repo && `<a href="${esc(p.repo)}" target="_blank" rel="noopener"><i data-lucide="code-xml" aria-hidden="true"></i>${esc(t("projects.code"))}</a>`,
  ].filter(Boolean).join("");
  return `
    <article class="project" style="--i:${i}">
      <div class="project-top">
        <span class="project-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>
        <span class="badges">
          ${isNew(p) ? `<span class="badge new">${esc(t("badge.new"))}</span>` : ""}
          <span class="badge ${cls}">${esc(statusLabel(p.status))}</span>
        </span>
      </div>
      <h3>${esc(pName(p))}</h3>
      <p>${esc(pDesc(p))}</p>
      <ul class="tags" aria-label="${esc(t("projects.tech"))}">${(p.tech || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      ${links ? `<div class="project-links">${links}</div>` : ""}
    </article>`;
}

function renderProjects() {
  if (!projects.length && !buildInfo && !loaded) return;
  const list = currentFilter === "all" ? projects : projects.filter((p) => p.status === currentFilter);
  $("#projects-grid").innerHTML = list.length
    ? list.map(projectCard).join("")
    : `<div class="empty"><i data-lucide="inbox" aria-hidden="true"></i><strong>${esc(t("projects.emptyTitle"))}</strong><span>${esc(t("projects.emptyText"))}</span></div>`;
  renderIcons();
}

$("#projects-grid").addEventListener("pointermove", (e) => {
  const card = e.target.closest(".project");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - r.left}px`);
  card.style.setProperty("--my", `${e.clientY - r.top}px`);
});

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
  projects.forEach((p) => (p.tech || []).forEach((x) => (byTech[x] = (byTech[x] || 0) + 1)));
  const entries = Object.entries(byTech).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  Chart.defaults.font.family = cssVar("--font-body");
  chart = new Chart($("#projectsChart"), {
    type: "bar",
    data: {
      labels: entries.map((e) => e[0]),
      datasets: [{ data: entries.map((e) => e[1]), borderRadius: 999, borderSkipped: false, barThickness: 12 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 1100, easing: "easeOutQuart", delay: (c) => c.dataIndex * 60 },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#0A1020", padding: 10, cornerRadius: 10, displayColors: false, callbacks: { label: (c) => t(c.raw === 1 ? "chart.one" : "chart.many", { n: c.raw }) } },
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
  const step = (now) => {
    const k = Math.min(1, (now - start) / 1200);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
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
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { Object.entries(values).forEach(([k, v]) => countUp($(`[data-stat="${k}"]`), v)); io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe($(".stats"));
}

/* ---------- Novedades ---------- */
function timeAgo(iso) {
  const diff = (new Date(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return t("time.now");
}
function renderNews() {
  if (!loaded) { $("#lastUpdate").textContent = t("news.loading"); return; }
  if (loadError) {
    $("#lastUpdate").textContent = "";
    $("#newsList").innerHTML = `<li class="muted small">${esc(t("news.error"))}</li>`;
    return;
  }
  $("#lastUpdate").textContent = buildInfo?.builtAt ? t("news.updated", { t: timeAgo(buildInfo.builtAt) }) : t("news.recent");
  const recent = [...projects].sort((a, b) => (isNew(b) - isNew(a)) || new Date(b.updated) - new Date(a.updated)).slice(0, 3);
  $("#newsList").innerHTML = recent.length
    ? recent.map((p, i) => {
        const cls = isNew(p) ? "new" : STATUS_CLS[p.status] || "plan";
        const icon = isIconName(p.icon) ? p.icon : "folder-git-2";
        return `
          <li class="news-item" style="--i:${i}">
            <span class="ni-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>
            <span class="ni-body">
              <strong>${esc(pName(p))}</strong>
              <span class="meta">${esc(t(isNew(p) ? "news.added" : "news.updatedItem"))} ${p.updated ? esc(timeAgo(p.updated)) : ""}</span>
            </span>
            <span class="badge ${cls}">${esc(isNew(p) ? t("badge.new") : statusLabel(p.status))}</span>
          </li>`;
      }).join("")
    : `<li class="muted small">${esc(t("news.empty"))}</li>`;
}

/* ---------- Encuesta de cotización ---------- */
const TYPE_ICONS = { web: "monitor", shop: "shopping-bag", app: "layout-dashboard", roblox: "gamepad-2", auto: "workflow", ai: "bot", other: "lightbulb" };
const PURPOSE_ICONS = { business: "store", startup: "rocket", company: "building-2", personal: "user", school: "graduation-cap" };
const STEPS = ["type", "purpose", "features", "budget", "you"];
const answers = { type: "", purpose: "", purposeName: "", features: [], budget: "", time: "", material: "", name: "", details: "" };
let stepIndex = 0;
let direction = 1;
let resultText = "";

const optionHTML = (type, name, value, label, checked, icon) => {
  const id = `${name}-${value}`;
  return `<div class="opt">
    <input type="${type}" name="${name}" id="${id}" value="${value}" ${checked ? "checked" : ""}>
    <label for="${id}">${icon ? `<span class="o-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span>` : ""}<span>${esc(label)}</span><span class="o-check" aria-hidden="true"><i data-lucide="check"></i></span></label>
  </div>`;
};
const optionsGroup = (type, name, opts, current, { icons, cls = "" } = {}) =>
  `<div class="opts ${cls}" role="${type === "radio" ? "radiogroup" : "group"}">${Object.entries(opts)
    .map(([v, l]) => optionHTML(type, name, v, l, type === "radio" ? current === v : current.includes(v), icons?.[v]))
    .join("")}</div>`;

function stepHTML(step) {
  const opt = (k) => t(k);
  switch (step) {
    case "type":
      return `<h3 id="qTitle">${esc(t("q.type"))}</h3><p class="hint"></p>${optionsGroup("radio", "type", opt("q.type.opts"), answers.type, { icons: TYPE_ICONS })}`;
    case "purpose":
      return `<h3 id="qTitle">${esc(t("q.purpose"))}</h3><p class="hint"></p>${optionsGroup("radio", "purpose", opt("q.purpose.opts"), answers.purpose, { icons: PURPOSE_ICONS })}
        <label class="q-label" for="purposeName">${esc(t("q.purpose.name"))} <em>(${esc(t("survey.optional"))})</em></label>
        <input class="field" id="purposeName" name="purposeName" autocomplete="organization" placeholder="${esc(t("q.purpose.namePh"))}" value="${esc(answers.purposeName)}">`;
    case "features":
      return `<h3 id="qTitle">${esc(t("q.features"))}</h3><p class="hint">${esc(t("survey.multi"))}</p>${optionsGroup("checkbox", "features", opt("q.features.opts"), answers.features)}`;
    case "budget":
      return `<h3 id="qTitle">${esc(t("q.budget"))}</h3><p class="hint"></p>
        <span class="q-label">${esc(t("q.budget.label"))}</span>${optionsGroup("radio", "budget", opt("q.budget.opts"), answers.budget, { cls: "pills" })}
        <span class="q-label">${esc(t("q.time.label"))}</span>${optionsGroup("radio", "time", opt("q.time.opts"), answers.time, { cls: "pills" })}
        <span class="q-label">${esc(t("q.material.label"))}</span>${optionsGroup("radio", "material", opt("q.material.opts"), answers.material, { cls: "pills" })}`;
    case "you":
      return `<h3 id="qTitle">${esc(t("q.you"))}</h3><p class="hint"></p>
        <label class="q-label" for="name">${esc(t("q.you.name"))}</label>
        <input class="field" id="name" name="name" autocomplete="name" required placeholder="${esc(t("q.you.namePh"))}" value="${esc(answers.name)}">
        <label class="q-label" for="details">${esc(t("q.you.details"))} <em>(${esc(t("survey.optional"))})</em></label>
        <textarea class="field" id="details" name="details" placeholder="${esc(t("q.you.detailsPh"))}">${esc(answers.details)}</textarea>`;
  }
}

function collect() {
  const form = $("#surveyForm");
  const get = (n) => form.querySelector(`[name="${n}"]:checked`)?.value;
  const step = STEPS[stepIndex];
  if (step === "type") answers.type = get("type") || "";
  if (step === "purpose") { answers.purpose = get("purpose") || ""; answers.purposeName = form.purposeName.value.trim(); }
  if (step === "features") answers.features = [...form.querySelectorAll('[name="features"]:checked')].map((i) => i.value);
  if (step === "budget") { answers.budget = get("budget") || ""; answers.time = get("time") || ""; answers.material = get("material") || ""; }
  if (step === "you") { answers.name = form.name.value.trim(); answers.details = form.details.value.trim(); }
}

function validate() {
  const step = STEPS[stepIndex];
  if (step === "type" && !answers.type) return t("survey.required");
  if (step === "purpose" && !answers.purpose) return t("survey.required");
  if (step === "budget" && (!answers.budget || !answers.time || !answers.material)) return t("survey.required");
  if (step === "you" && !answers.name) return t("survey.requiredName");
  return "";
}

function buildMessage() {
  const o = (k, v) => t(k)[v];
  const lines = [t("msg.hello", { name: answers.name }), ""];
  lines.push(`• ${t("msg.type")}: ${o("q.type.opts", answers.type)}`);
  lines.push(`• ${t("msg.purpose")}: ${o("q.purpose.opts", answers.purpose)}${answers.purposeName ? ` (${answers.purposeName})` : ""}`);
  if (answers.features.length) lines.push(`• ${t("msg.features")}: ${answers.features.map((f) => o("q.features.opts", f)).join(", ")}`);
  lines.push(`• ${t("msg.budget")}: ${o("q.budget.opts", answers.budget)}`);
  lines.push(`• ${t("msg.time")}: ${o("q.time.opts", answers.time)}`);
  lines.push(`• ${t("msg.material")}: ${o("q.material.opts", answers.material)}`);
  if (answers.details) lines.push("", `${t("msg.details")}: ${answers.details}`);
  lines.push("", t("msg.bye"));
  return lines.join("\n");
}

function renderSurvey() {
  const done = stepIndex >= STEPS.length;
  const total = STEPS.length;
  $("#surveyStep").textContent = done ? "✓" : t("survey.step", { n: stepIndex + 1, total });
  $("#surveyBar").style.width = `${done ? 100 : (stepIndex / total) * 100 + 100 / total / 2}%`;
  $("#surveyError").textContent = "";
  $("#surveyNav").hidden = done;
  const body = $("#surveyBody");

  if (done) {
    if (!resultText) resultText = buildMessage();
    body.innerHTML = `<div class="q">
      <div class="result-head"><span class="result-icon"><i data-lucide="check-check" aria-hidden="true"></i></span><h3>${esc(t("result.title"))}</h3></div>
      <p class="hint">${esc(t("result.lead"))}</p>
      <textarea class="field result-msg" id="resultMsg" aria-labelledby="qTitle">${esc(resultText)}</textarea>
      <div class="result-actions">
        <button type="button" class="btn wa" id="sendWa"><i data-lucide="message-circle" aria-hidden="true"></i><span>${esc(t("result.wa"))}</span></button>
        <button type="button" class="btn primary" id="sendMail"><i data-lucide="mail" aria-hidden="true"></i><span>${esc(t("result.mail"))}</span></button>
      </div>
      <div class="result-sub">
        <button type="button" class="link-btn" id="copyMsg"><i data-lucide="copy" aria-hidden="true"></i><span>${esc(t("result.copy"))}</span></button>
        <button type="button" class="link-btn muted" id="restart"><i data-lucide="rotate-ccw" aria-hidden="true"></i><span>${esc(t("result.restart"))}</span></button>
      </div>
    </div>`;
    const msg = $("#resultMsg");
    msg.addEventListener("input", () => (resultText = msg.value));
    $("#sendWa").onclick = () => window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg.value)}`, "_blank", "noopener");
    $("#sendMail").onclick = () => {
      const subject = t("msg.subject", { type: t("q.type.opts")[answers.type] });
      location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg.value.replace(/\n/g, "\r\n"))}`;
    };
    $("#copyMsg").onclick = async (e) => {
      const btn = e.currentTarget;
      try { await navigator.clipboard.writeText(msg.value); } catch { msg.select(); document.execCommand("copy"); }
      btn.querySelector("span").textContent = t("result.copied");
      setTimeout(() => (btn.querySelector("span").textContent = t("result.copy")), 1800);
    };
    $("#restart").onclick = () => {
      Object.assign(answers, { type: "", purpose: "", purposeName: "", features: [], budget: "", time: "", material: "", name: "", details: "" });
      resultText = ""; stepIndex = 0; direction = -1; renderSurvey();
    };
  } else {
    body.innerHTML = `<fieldset class="q ${direction < 0 ? "back" : ""}" style="border:0;margin:0;padding:0;min-width:0" aria-labelledby="qTitle">${stepHTML(STEPS[stepIndex])}</fieldset>`;
    $("#surveyBack").hidden = stepIndex === 0;
    $("#surveyNextLabel").textContent = t(stepIndex === STEPS.length - 1 ? "survey.finish" : "survey.next");
  }
  renderIcons();
}

$("#surveyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  collect();
  const err = validate();
  if (err) {
    const el = $("#surveyError");
    el.textContent = err;
    el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
    return;
  }
  stepIndex++; direction = 1; resultText = "";
  renderSurvey();
  if (stepIndex > 0) $("#survey").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
});
$("#surveyBack").addEventListener("click", () => { collect(); stepIndex = Math.max(0, stepIndex - 1); direction = -1; renderSurvey(); });
/* En el primer paso avanza solo al elegir una opción */
$("#surveyBody").addEventListener("change", (e) => {
  if (STEPS[stepIndex] === "type" && e.target.type === "radio") {
    setTimeout(() => $("#surveyForm").requestSubmit(), 260);
  }
});

/* ---------- Render general ---------- */
let loaded = false;
let loadError = false;

function renderAll() {
  applyStaticTexts();
  renderLangMenu();
  syncThemeUI();
  renderSkills();
  if (loaded && !loadError) { renderProjects(); renderCounts(); }
  if (loaded && loadError) renderLoadError();
  renderNews();
  if (stepIndex >= STEPS.length) resultText = buildMessage();
  renderSurvey();
  if (chart) { chart.options.plugins.tooltip.callbacks.label = (c) => t(c.raw === 1 ? "chart.one" : "chart.many", { n: c.raw }); chart.update(); }
  renderIcons();
  requestAnimationFrame(movePill);
}

function renderLoadError() {
  $("#projects-grid").innerHTML = `<div class="empty"><i data-lucide="wifi-off" aria-hidden="true"></i><strong>${esc(t("projects.errorTitle"))}</strong><span>${esc(t("projects.errorText"))}</span></div>`;
}

async function init() {
  try {
    const r = await fetch("build-info.json", { cache: "no-store" });
    if (r.ok) buildInfo = await r.json();
    newFiles = new Set(buildInfo?.added || []);
  } catch {}
  try {
    const res = await fetch("projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    projects = await res.json();
    loaded = true;
    renderProjects();
    renderCounts();
    renderStats();
    renderNews();
    renderIcons();
    const chartIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { renderChart(); chartIo.disconnect(); } }, { threshold: 0.2 });
    chartIo.observe($("#projectsChart"));
  } catch {
    loaded = true; loadError = true;
    renderLoadError(); renderNews(); renderIcons();
  }
}

/* Aparición al hacer scroll */
const revealIo = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealIo.unobserve(e.target); } }),
  { threshold: 0.12 }
);

$("#year").textContent = new Date().getFullYear();
renderAll();
$$(".reveal").forEach((el) => revealIo.observe(el));
init();
