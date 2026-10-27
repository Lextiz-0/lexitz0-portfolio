const skills=[
{icon:"🌐",title:"Desarrollo web",text:"Sitios y aplicaciones web con HTML, CSS, JavaScript, React y Next.js."},
{icon:"🐍",title:"Python",text:"Scripts, automatizaciones, APIs con FastAPI, análisis de datos y herramientas internas."},
{icon:"🎮",title:"Roblox y Luau",text:"Sistemas de juego, interfaces, economía, misiones, guardado de datos y herramientas de desarrollo."},
{icon:"🗄️",title:"Bases de datos",text:"Modelado de datos, SQL, PostgreSQL, Supabase, migraciones y consultas."},
{icon:"⚙️",title:"Automatización",text:"Flujos que reducen trabajo repetitivo: reportes, respaldos, integraciones y bots."},
{icon:"🤖",title:"Inteligencia artificial",text:"Integración de modelos de IA para asistentes, generación de contenido, análisis y productividad."},
{icon:"📊",title:"Datos y métricas",text:"Dashboards, gráficas, KPIs y análisis para tomar mejores decisiones."},
{icon:"🔧",title:"Git y GitHub",text:"Control de versiones, ramas, pull requests, revisiones de código y colaboración."},
{icon:"🚀",title:"Despliegue",text:"Publicación de aplicaciones y configuración de entornos para que un proyecto esté disponible en línea."}
];
const grid=document.getElementById("skills-grid");
grid.innerHTML=skills.map(s=>`<article class="card"><span class="icon">${s.icon}</span><h3>${s.title}</h3><p>${s.text}</p></article>`).join("");
async function loadProjects(){
const res=await fetch("projects.json");
const projects=await res.json();
const projectGrid=document.getElementById("projects-grid");
projectGrid.innerHTML=projects.map(p=>`<article class="card"><span class="icon">${p.icon||"🚀"}</span><h3>${p.name}</h3><p>${p.description}</p><p><strong>Tecnologías:</strong> ${p.tech.join(", ")}</p><p><strong>Estado:</strong> ${p.status}</p></article>`).join("");
const byTech={};
projects.forEach(p=>p.tech.forEach(t=>byTech[t]=(byTech[t]||0)+1));
const labels=Object.keys(byTech);
const data=Object.values(byTech);
new Chart(document.getElementById("projectsChart"),{type:"bar",data:{labels,datasets:[{label:"Proyectos por tecnología",data,backgroundColor:"rgba(56,189,248,.75)",borderColor:"#38bdf8",borderWidth:1,borderRadius:8}]},options:{responsive:true,plugins:{legend:{labels:{color:"#e5e7eb"}}},scales:{x:{ticks:{color:"#9ca3af"},grid:{color:"#243044"}},y:{beginAtZero:true,ticks:{color:"#9ca3af",precision:0},grid:{color:"#243044"}}}}});
}
document.getElementById("year").textContent=new Date().getFullYear();
loadProjects();
