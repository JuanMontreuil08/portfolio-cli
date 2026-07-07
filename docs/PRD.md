# PRD — Portafolio en terminal vía SSH

> Documento de requisitos para implementar con Claude Code.
> Versión 0.1 · Alcance: portafolio personal navegable por terminal, listo para compartir.

---

## 1. Resumen

Construir un portafolio personal que vive **dentro de la terminal**. Cualquier persona se conecta con un solo comando —`ssh hi.midominio.com`— y, sin instalar nada ni autenticarse, navega un portafolio interactivo (flechas para moverse, `enter` para seleccionar, `q` para salir) con una estética monoespaciada minimalista.

La aplicación se construye con **Node + TypeScript + Ink** (React para terminal) y se sirve por SSH mediante un servidor **ssh2**, desplegado en **Fly.io** con un dominio propio vía DNS.

Referencia visual y de interacción: el portafolio de Zach Krall (`ssh hi.zachkrall.com`) — nav horizontal arriba, retrato en ASCII tramado junto al texto, barra de estado abajo con atajos, acento ámbar sobre fondo oscuro.

**Restricción arquitectónica central:** los datos y la lógica viven en una capa `core/` independiente de la interfaz. SSH es solo el primer "lector" de esa capa. Esto permite que, en una fase posterior, un servidor MCP exponga los mismos datos a agentes **sin reescribir nada**. Toda la implementación de esta fase debe respetar esta separación.

---

## 2. Objetivos y no-objetivos

### Objetivos (esta fase)
- Portafolio navegable por terminal con 4 secciones: **About · Proyectos · Experiencia · Contacto**.
- Retrato del autor renderizado en ASCII/dithered en la vista principal.
- Navegación por teclado: flechas/`tab` para moverse entre secciones, `enter` para entrar a una opción, `q` para salir.
- Servir la app por SSH con acceso anónimo (sin login).
- Desplegado y accesible mediante un dominio propio.
- Datos del portafolio en un archivo de configuración editable (`portfolio.yaml`), separado del código.

### No-objetivos (fuera de alcance, no romper la arquitectura para ellos)
- **Servidor MCP** para agentes — fase siguiente; la capa `core/` debe quedar lista para ello, pero no se implementa ahora.
- **Registro multi-usuario** de portafolios de varios devs.
- **Generador web** ("pega tu portafolio y te lo creo").
- **Autenticación / identidad** de usuarios.
- **Persistencia / base de datos** — el estado vive en memoria durante la sesión.
- **Rate limiting** avanzado — dejar un punto de extensión, pero no es bloqueante para esta fase.

---

## 3. Usuarios y caso de uso

**Usuario primario:** alguien (reclutador, colega, curioso) que recibe el comando `ssh hi.midominio.com`, lo ejecuta y explora el portafolio del autor en su propia terminal. Sesión efímera: entra, navega, sale.

**Flujo:**
1. Ejecuta `ssh hi.midominio.com`.
2. Ve la vista principal: retrato ASCII + descripción breve, nav superior, atajos abajo.
3. Se mueve entre **About · Proyectos · Experiencia · Contacto** con flechas/`tab`.
4. Entra a una sección con `enter`, revisa el contenido (p. ej. lista de proyectos con descripción y repo).
5. Sale con `q`.

---

## 4. Stack técnico

| Componente | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Runtime | Node.js 20+ |
| UI de terminal | Ink (v5+, React para CLI) |
| Servidor SSH | `ssh2` (Server) |
| Formato de datos | YAML (`portfolio.yaml`), parseado con `yaml` o `js-yaml` |
| ASCII art | Pre-generado offline (no en runtime). Herramientas sugeridas: `chafa` (modo braille/símbolos) o dithering con Python/PIL. Resultado guardado como `.txt` |
| Gestor de paquetes | pnpm (o npm) |
| Despliegue | Fly.io (servicio TCP) |
| DNS | Registro A/AAAA del subdominio apuntando a la IP de Fly |

---

## 5. Arquitectura y estructura del repo

**Regla de oro:** `ssh/` (y en el futuro `mcp/`) **no contienen lógica de negocio**. Solo importan de `core/`. Toda la lectura de datos, validación y búsqueda vive en `core/`.

```
portfolio/
├── core/                  # El cerebro. No sabe nada de SSH ni de MCP.
│   ├── schema.ts          # Tipos: Portfolio, Project, Experience, Contact
│   ├── load.ts            # Lee y valida portfolio.yaml -> objeto tipado
│   ├── search.ts          # buscarProyectos(query) — lógica reutilizable
│   └── portfolio.yaml     # LOS DATOS del autor (editable, sin tocar código)
│
├── assets/
│   └── portrait.txt       # Retrato ASCII pre-generado
│
├── ui/                    # Componentes de Ink (presentación pura)
│   ├── App.tsx            # Componente raíz: estado de navegación + layout
│   ├── Nav.tsx            # Barra de navegación superior
│   ├── StatusBar.tsx      # Barra de atajos inferior
│   ├── views/
│   │   ├── About.tsx      # Retrato ASCII + descripción breve
│   │   ├── Projects.tsx   # Lista navegable de proyectos
│   │   ├── Experience.tsx # Experiencia profesional
│   │   └── Contact.tsx    # Contacto y enlaces
│   └── theme.ts           # Colores/acentos (fondo oscuro, acento ámbar)
│
├── ssh/                   # Cáscara delgada para humanos
│   └── server.tsx         # Servidor ssh2 + render de Ink al stream
│
├── scripts/
│   └── make-portrait.*    # Script para generar portrait.txt desde una foto
│
├── host.key               # Llave del host SSH (NO commitear; secret en deploy)
├── fly.toml               # Config de Fly.io (servicio TCP)
├── Dockerfile
├── package.json
└── PRD.md
```

> Nota para Claude Code: la carpeta `mcp/` **no se crea en esta fase**, pero `core/search.ts` debe quedar escrita de forma que una futura herramienta MCP pueda llamarla directamente.

---

## 6. Modelo de datos

`core/schema.ts` define los tipos. `core/portfolio.yaml` contiene los datos. Los campos `description` y `tags` de cada proyecto se diseñan pensando en la futura búsqueda por agentes.

**Esquema (YAML de ejemplo — reemplazar con datos reales):**

```yaml
name: Nombre Apellido
headline: ML Engineer · sistemas de recomendación
location: Lima, PE
bio: >
  Una o dos frases sobre el autor. Esto es lo que ve un humano
  en la vista principal.

links:
  github: https://github.com/usuario
  website: https://sitio.dev
  linkedin: https://linkedin.com/in/usuario

contact: correo@ejemplo.com
contactable: true        # consentimiento para descubrimiento futuro vía agentes

projects:
  - title: Recomendador de películas
    description: >
      Sistema de recomendación con filtrado colaborativo sobre
      MovieLens, servido con FastAPI.
    tags: [recsys, collaborative-filtering, python, fastapi]
    stack: [Python, PyTorch, FastAPI]
    repo: https://github.com/usuario/movie-recs
    year: 2025

experience:
  - role: ML Engineer
    company: Empresa S.A.
    period: 2023 – presente
    summary: >
      Una línea sobre el rol y el impacto.

  - role: Data Analyst
    company: Otra Empresa
    period: 2021 – 2023
    summary: >
      Una línea.
```

**Validación:** `core/load.ts` debe parsear el YAML, validar contra el esquema (campos requeridos: `name`, `bio`, `projects`) y fallar con un mensaje claro si falta algo. Sugerencia: usar `zod` para validar.

---

## 7. Especificación de la UI (Ink)

### Estética (replicar la referencia)
- Tipografía monoespaciada, **fondo oscuro**.
- Color de **acento ámbar/naranja** para elementos interactivos: la sección activa en la nav, los corchetes/marcadores, los atajos resaltados.
- Texto principal en gris claro/blanco tenue.
- Sensación de "ventana" minimal, con aire alrededor del contenido.

### Layout (tres zonas verticales)
1. **Nav superior (horizontal):** `About   Proyectos   Experiencia   Contacto`. La sección activa se resalta en ámbar. A la derecha, opcionalmente un indicador (versión o tema).
2. **Contenido (centro):** cambia según la sección activa.
3. **Barra de estado (inferior):** a la izquierda `v0.1.0`; a la derecha los atajos: `↹ navegar   ↵ seleccionar   q salir`.

### Vistas
- **About:** retrato ASCII (`assets/portrait.txt`) a la izquierda; a la derecha, `headline` + `bio` + `location`. Es la vista por defecto al entrar.
- **Proyectos:** lista navegable (flechas arriba/abajo). Cada item muestra `title` + `description` + `tags` + `repo`. El proyecto seleccionado se resalta.
- **Experiencia:** lista de `role · company · period` con su `summary`.
- **Contacto:** `contact` + `links` (github, website, etc.).

### Interacción (teclado)
- `←` / `→` o `tab` / `shift+tab`: moverse entre secciones de la nav.
- `↑` / `↓`: moverse dentro de una lista (proyectos, experiencia).
- `enter`: entrar/seleccionar.
- `q` (o `ctrl+c`): salir limpiamente (desmontar Ink y cerrar la sesión).
- Manejo de input con el hook `useInput` de Ink.

### Estado
- Estado de navegación en memoria con `useState` (sección activa, índice seleccionado). No hay persistencia entre sesiones.

---

## 8. El retrato ASCII

- **Se genera una sola vez, offline**, no en tiempo de ejecución (evita dependencias de procesamiento de imagen en el servidor y permite afinarlo a mano).
- `scripts/make-portrait.*` toma una foto (`portrait.jpg`) y produce `assets/portrait.txt` con el estilo tramado/dithered de la referencia.
- En runtime, la vista **About** simplemente lee e imprime ese `.txt` dentro de un `<Text>`.
- Ajustar el ancho a ~40–50 columnas para que entre bien junto al texto en una terminal estándar (80 columnas).

---

## 9. Servidor SSH (`ssh/server.tsx`)

Levanta un servidor `ssh2.Server`. Por cada conexión, renderiza la app de Ink **al stream de esa sesión** (no a `process.stdout`).

### Requisitos
- **Autenticación:** anónima — aceptar a todos (`ctx.accept()`).
- **Host key:** cargar desde `host.key` (generado con `ssh-keygen`; en producción inyectado como secret).
- **PTY:** manejar el request `pty` y capturar `cols`/`rows` para pasarlos a Ink.
- **Shell:** al aceptar el `shell`, hacer que el stream "parezca" un TTY antes de renderizar:
  - `stream.isTTY = true`
  - `stream.columns = cols`, `stream.rows = rows`
  - `render(<App />, { stdout: stream, stdin: stream })`
- **Resize:** escuchar `window-change` y propagar el nuevo tamaño.
- **Cleanup:** en `close` del stream, llamar `unmount()` de Ink.
- **Puerto:** configurable por env var (`PORT`, default 2222 en local; 22 en producción).
- **Punto de extensión** para rate limiting por IP (no implementar a fondo, dejar el hook).

### Esqueleto de referencia

```ts
import { Server } from 'ssh2';
import { render } from 'ink';
import fs from 'fs';
import App from '../ui/App.js';

const server = new Server(
  { hostKeys: [fs.readFileSync('host.key')] },
  (client) => {
    client.on('authentication', (ctx) => ctx.accept());
    client.on('ready', () => {
      client.on('session', (accept) => {
        const session = accept();
        let term = { cols: 80, rows: 24 };
        session.on('pty', (a, _r, info) => { term = info; a(); });
        session.on('shell', (acceptShell) => {
          const stream = acceptShell();
          stream.isTTY = true;
          stream.columns = term.cols;
          stream.rows = term.rows;
          const { unmount } = render(<App />, { stdout: stream, stdin: stream });
          stream.on('close', () => unmount());
        });
      });
    });
  },
);
server.listen(Number(process.env.PORT) || 2222, '0.0.0.0');
```

---

## 10. Despliegue (Fly.io + DNS)

- **Servicio TCP** en `fly.toml` (no HTTP): exponer el puerto interno del servidor SSH y mapear el puerto público 22.
- **Host key como secret/volumen:** debe persistir entre despliegues; si cambia, los clientes verán la alerta "host key changed". Generarlo una vez e inyectarlo como secret de Fly.
- **DNS:** registro A/AAAA del subdominio (p. ej. `hi.midominio.com`) apuntando a la IP de Fly.
- **Verificación:** `ssh hi.midominio.com` desde una máquina limpia debe abrir el portafolio.

---

## 11. Plan de desarrollo por fases

Cada fase entrega algo verificable. Construir en este orden:

1. ✅ **`core/`** — `schema.ts`, `load.ts`, `search.ts`, `portfolio.yaml`. Parsea y valida YAML con Zod.
2. ✅ **Logo animado** — `assets/logo.txt` con efecto wave en acento teal.
3. ✅ **UI en Ink (local)** — 4 secciones navegables, Gemini AI summary + commits por proyecto, status bar contextual. `npm run local` funciona.
4. ✅ **Servidor SSH** — `ssh/server.tsx`. `ssh -t -p 2222 localhost` abre la UI correctamente. Fixes clave: CRLF conversion (`\n`→`\r\n`), PTY dimensions via `makeInkCompatible`, env file en script `dev`. `waitUntilExit().then(() => stream.end())` para cerrar sesión limpiamente con `q`.
4b. ✅ **UI responsive + polish** — Nav vertical en terminales < 90 cols. `wrapText` manual en About, Projects, Experience y ProjectDetail para evitar que el CRLF patch rompa el alineado del texto. Párrafos de IA divididos por `\n` antes de wrapText. Logo animado se pausa (sin unmount) al abrir ProjectDetail para eliminar renders de 80ms que compiten con el scroll.
5. ✅ **Despliegue** — Oracle Cloud VM (Ubuntu 22.04, free tier), VCN + Security List con puerto 2222 abierto, PM2 como process manager. App corriendo en `92.5.185.78:2222`. *Pendiente:* DNS `hi.juanmontreuil.com` → IP.
5b. ✅ **Fix colores + performance SSH** — Chalk detectaba `level = 0` al arrancar bajo PM2 (stdout no es TTY). Fix: `chalk.level = 3` en `server.tsx` antes del primer render. Logo optimizado: chars consecutivos del mismo color agrupados en segmentos → menos nodos React y menos datos ANSI por frame → navegación más rápida.

---

## 12. Criterios de aceptación (global)

- [ ] `ssh hi.juanmontreuil.com` abre el portafolio sin pedir contraseña ni instalar nada. (IP lista: `92.5.185.78:2222`, falta DNS)
- ✅ Se ve el logo animado + descripción breve en la vista inicial.
- ✅ Las 4 secciones (About, Proyectos, Experiencia, Contacto) son navegables con flechas/`tab` y `enter`.
- ✅ `q` cierra la sesión limpiamente.
- ✅ Editar `portfolio.yaml` cambia el contenido **sin tocar código**.
- ✅ La estética: monoespaciada, fondo claro, acento teal, status bar contextual.
- ✅ `core/` no importa nada de `ssh/`; `ssh/` solo importa de `core/` y `ui/`.
- ✅ Proyectos abren detalle con AI summary (Gemini) + commits recientes vía GitHub API.

---

## 13. Gotchas conocidos

- **Raw mode / PTY:** Ink necesita raw mode para capturar flechas y `q`. Sin PTY asignado aparece el error `Raw mode is not supported`. Al probar en local, conectarse con `ssh -t` para forzar la asignación de pseudo-terminal.
- **Stream como TTY:** el stream de `ssh2` no es un TTY por defecto; hay que asignar `isTTY`, `columns` y `rows` antes de `render()`. Ver `makeInkCompatible()` en `ssh/server.tsx`.
- **CRLF en SSH:** Ink escribe `\n` pero SSH sin PTY real necesita `\r\n`. Sin `\r` el cursor no regresa a columna 0 y el layout se rompe. Solución: interceptar `stream.write` y convertir `\n`→`\r\n`.
- **PTY dimensions:** leer `info.cols`/`info.rows` del evento `pty` en la session y pasarlos a `makeInkCompatible`. Las dimensiones del proceso servidor (`process.stdout.columns`) son incorrectas para el cliente.
- **Env vars en dev:** `npm run dev` necesita `--env-file=.env.local` para que `GEMINI_API_KEY` esté disponible.
- **Host key estable:** no regenerar el host key en cada deploy.
- **ASCII en runtime no:** pre-generar el retrato; no procesar la imagen en cada conexión.
- **`wrap="wrap"` en Ink + CRLF:** no usar el prop `wrap="wrap"` de `<Text>` — Ink inserta `\n` internos que el patch CRLF convierte a `\r\n`, reseteando el cursor a columna 0. Usar `wrapText` manual que produce `<Text>` separados por línea.
- **Párrafos con `\n` en AI text:** pasar el texto de IA por `text.split('\n')` antes de `wrapText`; de lo contrario `\n` queda dentro de un "word" y se rompe el alineado.
- **Logo animation vs scroll latency:** el `setInterval` de 80ms del Logo compite con re-renders del scroll en ProjectDetail. Solución: pasar `paused={detailOpen}` al Logo para detener el interval sin unmontarlo.
- **`q` deja terminal en blanco:** `exit()` de Ink no cierra el stream SSH. Usar `waitUntilExit().then(() => stream.end())` para cerrar la sesión y devolver el control al shell del cliente.
- **Resize en Kiro IDE:** Kiro reporta el ancho del panel (no la ventana) como PTY cols (~68–80) y no envía eventos `window-change` al redimensionar. El responsive funciona solo al momento de la conexión inicial.
- **Colores sin TTY (PM2/Oracle):** Chalk evalúa el nivel de color una vez al importar usando `process.stdout`. Bajo PM2, stdout no es TTY → `chalk.level = 0` → sin colores. Solución: `chalk.level = 3` explícito en `server.tsx` antes de cualquier render. Sin esto el acento teal y todos los ANSI codes son stripeados.
- **Performance animación SSH:** Renderizar un `<Text>` por carácter en el logo (~100 nodos) genera mucho tráfico ANSI por frame (cada 80ms). Agrupar chars consecutivos del mismo color en segmentos reduce a ~20-30 nodos y menos datos por frame → navegación más fluida sobre SSH.

---

## 14. Futuro (no implementar ahora — solo no cerrar la puerta)

- **MCP server** (`mcp/server.ts`): expondrá `core/search.ts` como herramienta `buscar_portafolios(query)` para agentes (Claude Code, Kiro, etc.). Por eso la lógica vive en `core/`.
- **Registro multi-usuario:** muchos `portfolio.yaml` (empezando por un repo de Git, un YAML por dev).
- **Generador para otros devs:** como datos y código están separados, el repo ya sirve de plantilla (clonar → reemplazar YAML y foto → desplegar). Un "pega aquí tu portafolio" web sería una capa encima, opcional.
