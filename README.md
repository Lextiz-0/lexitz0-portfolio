# Lextiz_0 — Portafolio

Sitio web personal para presentar habilidades y proyectos como programador.

## Cómo verlo

Abre `index.html` en tu navegador, o ejecuta:

```bash
python -m http.server 8000
```

Luego entra a: http://localhost:8000

## Actualizar proyectos

Edita `projects.json`. Cada proyecto necesita:

```json
{
  "name": "Nombre del proyecto",
  "description": "Descripción breve",
  "tech": ["Python", "Supabase"],
  "status": "Terminado",
  "icon": "🚀"
}
```

La gráfica se actualiza automáticamente según las tecnologías usadas.
