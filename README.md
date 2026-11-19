# Portfolio de diseño gráfico · María del Pilar Parra

Web estática (HTML + CSS + JavaScript, sin frameworks ni compilación) pensada para publicarse en **GitHub Pages**.

URL final: **https://mahpiuadev.github.io/graphic-designer/**

---

## 1. Estructura

```
graphic-designer/
├── index.html                 ← textos de Hero, Sobre mí y Contacto
├── css/styles.css             ← colores, tipografías y diseño (variables al inicio)
├── js/app.js                  ← filtros, vista de proyecto, visor de imágenes
├── data/
│   ├── categories.json        ← categorías
│   └── projects.json          ← proyectos
├── assets/
│   ├── projects/<id>/         ← imágenes de cada proyecto
│   ├── cv/CV_MariaDelPilarParra_Diseno.pdf   ← tu CV
│   └── img/                   ← foto, favicon e imagen para compartir (og.png)
├── scripts/optimize_images.py ← convierte las imágenes a WebP
├── sitemap.xml · robots.txt · .nojekyll
```

> Todas las rutas son **relativas** (sin `/` inicial) porque la web vive dentro de `/graphic-designer/`. Si añades enlaces o imágenes propias, escríbelos igual: `assets/...`, nunca `/assets/...`.

---

## 2. Previsualizar en tu ordenador

El navegador no deja cargar los `.json` abriendo `index.html` con doble clic. Usa un servidor local (necesitas Python):

```bash
cd graphic-designer
python -m http.server 8000
```

Abre http://localhost:8000

---

## 3. Publicar en GitHub Pages

1. En GitHub: **New repository** → nombre `graphic-designer` → **Public** → Create.
2. Sube **todo el contenido** de esta carpeta a la raíz del repositorio (con *Add file → Upload files* o con Git).
3. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En 1-2 minutos estará en https://mahpiuadev.github.io/graphic-designer/

Con Git:

```bash
git init
git add .
git commit -m "Portfolio inicial"
git branch -M main
git remote add origin https://github.com/mahpiuadev/graphic-designer.git
git push -u origin main
```

---

## 4. Añadir un proyecto

1. **Prepara las imágenes** (recomendado, para que la web cargue rápido):
   ```bash
   pip install pillow
   python scripts/optimize_images.py assets/projects/mi-proyecto
   ```
   Crea antes la carpeta `assets/projects/mi-proyecto/` y copia ahí tus JPG/PNG. El script genera versiones WebP y te imprime el bloque JSON listo para pegar. Después borra las originales pesadas de esa carpeta.
2. **Añade el proyecto** a `data/projects.json` (copia uno existente como plantilla):

```json
{
  "id": "mi-proyecto",
  "title": "Invitación de boda · Lucía y Javier",
  "categories": ["bodas-eventos"],
  "year": 2025,
  "role": "Diseño e ilustración",
  "client": "Lucía y Javier",
  "tools": ["Illustrator", "InDesign"],
  "description": "Qué pedían, cómo lo resolviste y cuál fue el resultado.",
  "featured": true,
  "gallery": "duo",
  "cover": { "src": "assets/projects/mi-proyecto/01.webp", "alt": "Descripción de la imagen", "width": 900, "height": 1250 },
  "images": [
    { "src": "assets/projects/mi-proyecto/01.webp", "alt": "Descripción de la imagen", "width": 900, "height": 1250 }
  ]
}
```

| Campo | Qué hace |
|---|---|
| `id` | Único, en minúsculas y con guiones. Es la URL del proyecto (`#proyecto/mi-proyecto`) y el nombre de su carpeta. |
| `categories` | Una o varias; deben existir en `categories.json`. |
| `featured` | `true` = sale en el collage del inicio (se usan los 3 primeros). |
| `gallery` | `"duo"` = las imágenes se muestran en dos columnas; vacío = una columna. |
| `cover` | Imagen de la tarjeta en la galería. |
| `images` | Todas las imágenes del proyecto (para una serie de carteles, ponlos todos aquí). |
| `alt` | **Obligatorio**: describe la imagen (accesibilidad y SEO). |
| `srcset` | Opcional; lo genera el script de optimización. |
| `year`, `role`, `client`, `tools`, `description` | Opcionales: si los quitas, no se muestran. |

Consejo: pon al principio del archivo los proyectos más fuertes; es el orden en que se ven.

### Serie de carteles de la peña
Súbelos como **un único proyecto** con todos los carteles en `images` (por ejemplo, «Temporada 2025/26»). Mantén el aviso del pie de página: son trabajos propios para la peña, no oficiales del club.

---

## 5. Añadir o cambiar categorías

Edita `data/categories.json`:

```json
{ "id": "ilustracion", "name": "Ilustración" }
```

Después usa ese `id` en el campo `categories` de los proyectos. Una categoría sin proyectos se oculta sola. Un proyecto puede estar en varias. Cada categoría tiene enlace directo: `https://mahpiuadev.github.io/graphic-designer/?cat=editorial`

---

## 6. Qué personalizar (están marcados con `EDITAR` en `index.html`)

- Titular y frase del hero.
- Texto de «Sobre mí» y lista de herramientas.
- Foto: sube `assets/img/pilar.jpg` y cambia la ruta en la sección *Sobre mí*.
- **CV**: sustituye `assets/cv/CV_MariaDelPilarParra_Diseno.pdf` por el tuyo **con el mismo nombre**. El peso (KB) se muestra solo en los botones.
- Imagen para compartir en redes: sustituye `assets/img/og.png` (1200×630 px).
- Email y LinkedIn (si cambian) en la sección *Contacto* y en el bloque `application/ld+json`.
- Paleta: en `index.html` cambia `data-palette="terracota"` por `"botella"` (verde) o edita las variables de `css/styles.css`. El modo claro/oscuro se activa con el botón de la cabecera.

### Formulario de contacto (opcional)
1. Crea una cuenta gratuita en https://formspree.io y un formulario nuevo.
2. Copia su ID (algo como `xyzabcde`) y sustituye `TU_ID` en `action="https://formspree.io/f/TU_ID"` de `index.html`.

Mientras sea `TU_ID`, el formulario se oculta solo y queda únicamente el botón «Escríbeme».

### Analítica respetuosa con la privacidad (opcional, desactivada)
Si más adelante la quieres, [GoatCounter](https://www.goatcounter.com) o [Plausible](https://plausible.io) no usan cookies. Pega su script antes de `</body>`.

---

## 7. Checklist antes de enviar el enlace a un reclutador

- [ ] Todas las imágenes de ejemplo sustituidas por trabajos reales (busca «ejemplo» en `data/projects.json`).
- [ ] Cada imagen tiene `alt` descriptivo.
- [ ] Los primeros 3-4 proyectos son los más cuidados.
- [ ] Cada categoría tiene al menos 2-3 proyectos (si no, fusiónala).
- [ ] Textos del hero, «Sobre mí» y descripciones revisados (sin faltas).
- [ ] Datos de las invitaciones de boda: nombres, fechas y lugares con permiso o tapados.
- [ ] CV de diseño subido con el nombre exacto y el botón descarga bien (cabecera, hero, sobre mí y contacto).
- [ ] Foto personal subida.
- [ ] El email abre el correo y LinkedIn lleva a tu perfil.
- [ ] Probado en el móvil y en el escritorio, en modo claro y oscuro.
- [ ] Al compartir el enlace por WhatsApp/LinkedIn sale bien la imagen de vista previa (`og.png`).
- [ ] Probado en https://pagespeed.web.dev (objetivo: 90+).
- [ ] Imágenes originales pesadas fuera del repositorio.
