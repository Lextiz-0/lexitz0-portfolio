# Lextiz_0 — Portafolio

Sitio personal publicado en **https://lextiz-0.github.io/lexitz0-portfolio/**

## Despliegue automático

Cada vez que subes o cambias un archivo en la rama `main` (por terminal o con **Add file → Upload files** en GitHub), el flujo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **Detecta** qué archivos son nuevos o cambiaron y los muestra en el resumen de la ejecución (pestaña *Actions*).
2. **Valida y compila** el sitio con `scripts/build.mjs` en la carpeta `dist/`.
3. **Publica** el resultado en GitHub Pages (1–2 minutos).

Si un proyecto tiene un error (JSON inválido o falta un campo), la compilación se detiene y el sitio publicado no se rompe.

También puedes lanzarlo a mano desde *Actions → Compilar y publicar sitio → Run workflow*.

## Agregar un proyecto

Sube un archivo `.json` nuevo a la carpeta `projects/`. Aparece en el sitio automáticamente, con la etiqueta **Nuevo** en ese despliegue.

```json
{
  "name": "Nombre del proyecto",
  "description": "Descripción breve",
  "tech": ["Python", "Supabase"],
  "status": "Terminado",
  "icon": "rocket",
  "url": "https://demo.ejemplo.com",
  "repo": "https://github.com/Lextiz-0/mi-proyecto"
}
```

- `status`: `Terminado`, `En desarrollo` o `Planeado`.
- `icon`: cualquier nombre de [Lucide](https://lucide.dev/icons/) (opcional).
- `url` y `repo`: opcionales.
- `translations`: opcional. Nombre y descripción en otros idiomas (`en`, `pt`, `fr`). Si falta, se muestra el texto en español.

```json
"translations": {
  "en": { "name": "Project name", "description": "Short description" }
}
```

## Idiomas

El sitio está en español, inglés, portugués y francés. Todos los textos están en `i18n.js`. Para agregar otro idioma, copia el bloque `es`, cambia la clave (por ejemplo `it`) y traduce los textos.

## Cotizaciones

La sección **Cotizar** tiene una encuesta de 5 pasos. Al terminarla se escribe un mensaje con las respuestas y el visitante lo envía con un clic por WhatsApp o correo. El número y el correo están al inicio de `app.js`, en `CONTACT`.

Las imágenes u otros archivos van en `assets/` y se publican tal cual.

## Probar en local

```bash
node scripts/build.mjs
python -m http.server 8000 -d dist
```

Luego entra a http://localhost:8000
