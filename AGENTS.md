# AGENTS.md — Guía para Agentes en Nemi Frontend (`nemi`)

Guía operativa, arquitectónica y técnica para agentes de Inteligencia Artificial que colaboren en el desarrollo, mantenimiento y optimización del frontend de **Nemi** (`nemi`).

---

## 1. Visión General del Proyecto

**Nemi Frontend** es una Single Page Application (SPA) corporativa construida en **Angular 22**, diseñada para la gestión, auditoría, asignación y rastreo de activos tecnológicos (hardware, software, licencias y garantías) en tiempo real.

- **Propósito:** Interfaz administrativa intuitiva, reactiva y segura con soporte de roles (RBAC), modo claro/oscuro dinámico, reportes analíticos con gráficas interactivas y exportación en PDF.
- **Dominio Frontend en Producción:** [https://nemi.mgdc.site](https://nemi.mgdc.site)
- **Backend API:** [https://nemi-api.fluxdv.icu](https://nemi-api.fluxdv.icu) (ver [AGENTS.md del Backend](file:///home/ivan/software-dev/nemi-api/AGENTS.md))
- **Assets en Cloudflare R2:** [https://assets.mgdc.site/nemi/](https://assets.mgdc.site/nemi/)
- **Repositorio en GitHub:** [https://github.com/ivndv/nemi](https://github.com/ivndv/nemi)

---

## 2. Antes de Tocar Código (Contexto con CodeGraph)

Este proyecto cuenta con un grafo de conocimiento indexado con **CodeGraph** (164 archivos, ~2,179 nodos y ~3,808 aristas).

- **Uso del MCP CodeGraph:** Antes de realizar búsquedas masivas de texto (`grep`), listar directorios o leer múltiples archivos a ciegas, invoca la herramienta MCP `codegraph_explore` indicando:

  ```json
  {
    "projectPath": "/home/ivan/software-dev/nemi",
    "query": "tu consulta de arquitectura, componente o flujo"
  }
  ```

  Te proveerá el grafo de dependencias, blast radius y código verbatim de los componentes y servicios en una sola llamada eficiente.
- **Sincronización del Índice:**
  Si creas o renombras componentes/módulos, sincroniza el índice ejecutando:

  ```bash
  codegraph sync /home/ivan/software-dev/nemi
  ```

---

## 3. Stack Tecnológico

| Capa                    | Tecnología                     | Versión / Detalle                                                          |
| :---------------------- | :----------------------------- | :------------------------------------------------------------------------- |
| **Framework SPA**       | **Angular 22**                 | `@angular/core ^22.2.4`, Angular CLI `^22.2.5` (NgModule + lazy loading)   |
| **Runtime & Gestor**    | **Bun**                        | Bun `1.4.4` (`bun.lock`)                                                   |
| **Lenguaje**            | **TypeScript**                 | `typescript ~6.0.3` (Modo estricto ESM)                                    |
| **UI & Componentes**    | **Angular Material + CDK**     | `@angular/material ^22.2.5`, `@angular/cdk ^22.2.5`                        |
| **Iconografía**         | **Iconify**                    | `iconify-icon ^3.0.5` (Web Components con prefijo `ph:` de Phosphor Icons) |
| **Selects Avanzados**   | **Ng-Select**                  | `@ng-select/ng-select ^24.2.1`                                             |
| **Estado del servidor** | **TanStack Query (Angular)**   | `@tanstack/angular-query-experimental ^5.105.2`                            |
| **Gráficas**            | **Chart.js**                   | `chart.js ^4.6.1` (Gráficas de pastel y barras en reportes)                |
| **Generación de PDFs**  | **jsPDF + html2canvas**        | `jspdf ^4.2.1`, `jspdf-autotable ^5.0.9`, `html2canvas ^1.4.1`             |
| **Alertas Modales**     | **SweetAlert2**                | `sweetalert2 ^11.26.25` (Estilizado con clases corporativas premium)       |
| **Estilos**             | **SCSS modular**               | `src/styles/` (`_tokens`, `_base`, `_components`, `_shell`, `_mixins`)     |
| **Pruebas Unitarias**   | **Jest + Jest Preset Angular** | `jest ^30.5.2`, `jest-preset-angular ^17.0.3`, `ts-jest ^29.4.15`          |
| **Linter & Formatter**  | **Biome 2**                    | `@biomejs/biome ^2.6.4` (`biome.json`)                                     |
| **Despliegue**          | **Cloudflare Pages**           | Configurado en `public/_headers` con CSP, cache inmutable y SSL estricto   |

---

## 4. Arquitectura de Módulos y Enrutamiento

La aplicación utiliza carga perezosa (**Lazy Loading**) para optimizar el rendimiento y tiempo de carga inicial.

### 4.1 Capas transversales

```
src/app/
├── core/                  # Infraestructura transversal (sin UI)
│   ├── catalogos/         # CatalogosFacade (estados, tipos, ubicaciones, dueños)
│   ├── http/              # getHttpErrorMessage: normalización de errores HTTP
│   ├── preferencias/      # PreferenciasService (zona horaria de negocio)
│   └── query/             # queryClient global de TanStack Query
├── models/                # Interfaces del dominio (activo, licencia, solicitud, ...)
├── services/              # AuthGuard y RoleGuard
├── shared/                # Componentes y servicios globales
│   ├── header/            # Tema, notificaciones y menú de perfil
│   ├── footer/
│   ├── adjuntos/          # AdjuntosComponent + diálogo de subida + AdjuntoService
│   ├── pipes/             # fecha-app.pipe.ts
│   ├── services/          # ThemeService, NotificationService
│   └── ui/modal/          # ModalShellComponent
├── navigation/            # Navbar lateral, caja-nav y NavigationService
└── utils/                 # chartTheme.ts (Chart.js), images.ts (transformación R2)
```

### 4.2 Módulos de funcionalidad (rutas lazy)

```
src/app/
├── login/                 # /login
│   ├── components/login   # Vista, formulario reactivo y theme toggle flotante
│   └── services/          # AuthService + AuthInterceptor
├── dashboard/             # /dashboard           (Administrador, Técnico, Almacén)
│   ├── panel-control/     # Métricas y KPIs
│   ├── resumen-activos/   # Conteo de activos por estado
│   └── alertas/           # Vencimientos de garantías y licencias
├── activo/                # /gestion-activos
│   ├── lista-activos/     # Tabla paginada con filtros
│   ├── detalle-activo/    # Ficha técnica
│   ├── agregar-activo/    # Alta con carga de foto a R2
│   ├── editar-activo/     # Especificaciones y garantías
│   ├── historial-activo/  # Timeline de trazabilidad
│   ├── application/       # ActivosFacade, ActivoDetalleFacade, ActivosMutacionesFacade
│   ├── infrastructure/    # ActivosRepository (acceso a API)
│   └── service/           # activo, datos e historial
├── asignacion/            # /asignaciones
│   ├── lista-asignaciones/ · asignar-activo/ · editar-asignacion/
│   ├── activos-asignados/ · activos-disponibles/
│   └── services/          # asignacion, auxiliares, activos-disponibles
├── licencia/              # /licencias
│   ├── lista-licencias/ · detalle-licencia/
│   ├── dialogs/           # asignar-asiento, renovar-licencia
│   └── services/licencia.service.ts
├── mantenimiento/         # /mantenimientos      (Administrador, Técnico)
│   ├── lista-mantenimientos/ · detalle-mantenimiento/
│   ├── dialogs/           # abrir-mantenimiento, cerrar-mantenimiento
│   └── services/mantenimiento.service.ts
├── solicitud/             # /solicitudes
│   ├── lista-solicitudes/ · detalle-solicitud/
│   ├── dialogs/           # nueva, decisión y entrega de solicitud
│   └── services/solicitud.service.ts
├── incidencia/            # /incidencias
│   ├── lista-incidencias/ · detalle-incidencia/
│   ├── dialogs/           # reportar-incidencia, generar-mantenimiento
│   └── services/incidencia.service.ts
├── reporte/               # /reportes            (Administrador, Técnico, Almacén)
│   ├── reporte/           # Filtros, Chart.js y exportación PDF
│   └── service/           # reporte, datos-auxiliares
├── usuario/               # /usuarios            (Administrador)
│   ├── lista-usuarios/ · dialogs/usuario-form-dialog
│   └── services/persona.service.ts
└── configuracion/         # /configuracion
    ├── configuracion-aplicacion/
    └── services/configuracion.service.ts
```

### 4.3 Guards y roles

- `AuthGuard`: exige sesión válida; redirige a `/login`.
- `RoleGuard`: lee `data.expectedRoles` (arreglo) o `data.expectedRole` (texto), valida con `hasAnyRole()` y muestra SweetAlert de acceso denegado.
- Rutas con roles: `dashboard`, `mantenimientos`, `reportes` (Administrador, Técnico, Almacén) y `usuarios` (Administrador).
- Redirección por defecto: `"" → login`; acceso denegado → `/gestion-activos` para empleados, `/dashboard` para el resto.

---

## 5. Servicios Clave y Patrones

### `AuthService` (`src/app/login/services/auth.service.ts`)

- Maneja `authToken` y `user` en `localStorage`, más `authMessage` en `sessionStorage`.
- Expone `user$` (BehaviorSubject) y `onLogout()` (Subject) para reaccionar a cambios de sesión.
- Métodos: `login()`, `saveToken()`, `logout(motivo?)`, `logoutAll()`, `isLoggedIn()`, `hasRole()`, `hasAnyRole()`, `isAdmin()`, `isEmpleado()`.
- `AuthInterceptor` adjunta el JWT a las peticiones salientes.

### `ThemeService` (`src/app/shared/services/theme.service.ts`)

- Tipo `Theme = "light" | "dark" | "system"`.
- Signals: `theme`, `resolvedTheme` e `isDark` (computed).
- Persiste la preferencia en `localStorage` (`nemi-theme`) y escucha `prefers-color-scheme` cuando el tema es `system`.
- Aplica o remueve la clase `dark-mode` en `document.body`; `current` se mantiene por compatibilidad.

### `NotificationService` (`src/app/shared/services/notification.service.ts`)

- Consulta los endpoints de alertas del backend (`licencia_proxima`, `garantia_proxima`, `devolucion_proxima`, incidencias, mantenimientos y solicitudes).
- Alimenta `alertasList$` y `totalAlerts$` para el badge y el menú del Header.

### `PreferenciasService` (`src/app/core/preferencias/preferencias.service.ts`)

- Obtiene la zona horaria de negocio desde `/configuracion/ajustes`.
- `fechaHoy()` devuelve `YYYY-MM-DD` en esa zona (no en la del navegador).

### `queryClient` (`src/app/core/query/query-client.ts`)

- `staleTime` 30s, `gcTime` 5min, `retry: 1`, sin refetch al enfocar; mutaciones sin retry.
- Se registra en `AppModule` con `provideTanStackQuery(queryClient)`.

### Patrón facade + repository

- **`application/*.facade.ts`**: estado y casos de uso con `signal`/`computed` + `injectQuery`/`injectMutation`. Es lo que consumen los componentes.
- **`infrastructure/*.repository.ts`**: única capa que habla con la API (`HttpClient`).
- **Componentes**: no inyectan `HttpClient` directamente; consumen facades o servicios del módulo.

---

## 6. Variables de Entorno

- **Desarrollo (`src/environments/environment.ts`):**

  ```typescript
  export const environment = {
    production: false,
    apiUrl: "http://localhost:3030/api",
  };
  ```
- **Producción (`src/environments/environment.prod.ts`):**

  ```typescript
  export const environment = {
    production: true,
    apiUrl: "https://nemi-api.fluxdv.icu/api",
  };
  ```

> Los assets públicos (avatares, imágenes) se resuelven con `src/app/utils/images.ts` contra `https://assets.mgdc.site/nemi/`; ya no existe `r2PublicUrl` en los environments.

---

## 7. Estándares de Seguridad y Despliegue (`public/_headers`)

El archivo `public/_headers` se sincroniza con Cloudflare Pages en cada despliegue:
- **CSP (Content-Security-Policy):**
  - `default-src 'self';`
  - Scripts: `self`, `'unsafe-inline'`, `'unsafe-eval'`, `static.cloudflareinsights.com`, `challenges.cloudflare.com`, `code.iconify.design`.
  - Estilos: `self`, `'unsafe-inline'`, `fonts.googleapis.com`, `challenges.cloudflare.com`.
  - Imágenes: `self`, `data:`, `https:`, `https://assets.mgdc.site`, `https://nemi-api.fluxdv.icu`.
  - Conexiones: `self`, `http://localhost:*`, `cloudflareinsights.com`, `challenges.cloudflare.com`, `nemi-api.fluxdv.icu`, `api.iconify.design`, `api.simplesvg.com`, `api.unisvg.com`.
  - `frame-ancestors 'none'`, `object-src 'none'` y `upgrade-insecure-requests`.
- **Cache Control:**
  - `/index.html` y `/*.html`: `public, max-age=0, s-maxage=3600, must-revalidate`.
  - `/assets/*.js`, `/*.js`, `/assets/*.css`, `/*.css`, `*.woff2`, `*.woff`: `public, max-age=31536000, s-maxage=2592000, immutable`.
  - Imágenes (`png`, `jpg`, `jpeg`, `svg`, `webp`, `avif`, `ico`): `public, max-age=31536000, s-maxage=604800`.
  - `manifest.json` y `sw.js`: `max-age=0, must-revalidate`.

- **CI/CD (`.github/workflows/ci-cd.yml`):** jobs paralelos `lint` (Biome CI) y `test` (Jest); `deploy` solo en push a `main`, con `bunx wrangler pages deploy dist/nemi/browser --project-name=nemi --branch=main`.

---

## 8. Comandos de Desarrollo y Testing

Todos los comandos se ejecutan desde `/home/ivan/software-dev/nemi` con **Bun**:

```bash
# Servidor de desarrollo local (puerto 4200 por defecto)
bun run start

# Compilar para producción (genera dist/nemi/browser)
bun run build

# Compilar en modo observación (development)
bun run watch

# Suite de pruebas unitarias con Jest
bun run test

# Pruebas en modo interactivo
bun run test:watch

# Linter y formateador Biome
bun run check
bun run lint
bun run format

# Arquitectura y símbolos con CodeGraph
codegraph
```

---

## 9. Reglas y Directrices para Agentes

1. **Usa CodeGraph MCP primero:** antes de modificar un servicio o componente, ejecuta `codegraph_explore` para identificar qué archivos y pruebas se verán afectados.
2. **Consistencia de tema (dark/light):** toda vista, tabla, modal o formulario debe usar las variables semánticas de `src/styles/_tokens.scss` (`--bg`, `--surface`, `--text`, `--border`, `--primary`, etc.) y funcionar en ambos temas.
3. **Estado del servidor con TanStack Query:** la UI consume facades con signals; no añadas `HttpClient` directo en componentes ni lógica de caché manual.
4. **Validación de formularios:** usa `ReactiveFormsModule` con validaciones declarativas y mensajes de error accesibles.
5. **Pruebas unitarias:** si agregas o modificas un servicio o componente, actualiza su `.spec.ts` y verifica con `bun run test`. Puedes reutilizar los proveedores de `src/testing/test-providers.ts`.
6. **Formato:** todo el código pasa por Biome (`bun run check`); no introduzcas estilos de formato distintos.
7. **No comitear sin aprobación:** nunca ejecutes `git commit` o `git push` sin la confirmación explícita del usuario.
