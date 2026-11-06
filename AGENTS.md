# AGENTS.md — Nemi (`nemi`)

## 1. Visión general

**Nemi Frontend** es una Single Page Application (SPA) corporativa construida en **Angular 22** para la gestión, auditoría, asignación y rastreo de activos tecnológicos (hardware, software, licencias y garantías) en tiempo real.

- **Propósito:** interfaz administrativa reactiva y segura con RBAC, modo claro/oscuro dinámico, reportes analíticos con gráficas interactivas y exportación en PDF.
- **Dominio en producción:** [https://nemi.mgdc.site](https://nemi.mgdc.site)
- **Backend API:** [https://nemi-api.fluxdv.icu](https://nemi-api.fluxdv.icu) (ver [AGENTS.md del backend](file:///home/ivan/software-dev/nemi-api/AGENTS.md))
- **Assets en Cloudflare R2:** [https://assets.mgdc.site/nemi/](https://assets.mgdc.site/nemi/)
- **Repositorio:** [https://github.com/ivndv/nemi](https://github.com/ivndv/nemi)

## 2. Antes de tocar código

**CodeGraph** (índice de símbolos del repo): usa `codegraph_explore` (`query`, `maxFiles`, `projectPath`) antes de un grep masivo o de leer varios archivos; devuelve fuente verbatim, rutas de llamada e impacto.

- `codegraph sync /home/ivan/software-dev/nemi` tras editar, pull o cambiar de rama (incremental, uso normal).
- `codegraph index /home/ivan/software-dev/nemi` solo al crear el índice, tras `codegraph upgrade` o si `status` avisa `built by vX` (rebuild completo).
- `codegraph status /home/ivan/software-dev/nemi` para comprobar el estado.

Antes de modificar un servicio o componente, identifica con CodeGraph qué archivos y pruebas se verán afectados. Respeta la separación facades/repositories descrita en §5.

## 3. Stack tecnológico

| Capa | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Framework SPA** | **Angular 22** | `@angular/core ^22.2.4`, Angular CLI `^22.2.5` (NgModule + lazy loading) |
| **Runtime & gestor** | **Bun** | Bun `1.4.4` (`bun.lock`) |
| **Lenguaje** | **TypeScript** | `typescript ~6.0.3` (modo estricto ESM) |
| **UI & componentes** | **Angular Material + CDK** | `@angular/material ^22.2.5`, `@angular/cdk ^22.2.5` |
| **Iconografía** | **Iconify** | `iconify-icon ^3.0.5` (Web Components con prefijo `ph:` de Phosphor Icons) |
| **Selects avanzados** | **Ng-Select** | `@ng-select/ng-select ^24.2.1` |
| **Estado del servidor** | **TanStack Query (Angular)** | `@tanstack/angular-query-experimental ^5.105.2` |
| **Gráficas** | **Chart.js** | `chart.js ^4.6.1` (pastel y barras en reportes) |
| **Generación de PDFs** | **jsPDF + html2canvas** | `jspdf ^4.2.1`, `jspdf-autotable ^5.0.9`, `html2canvas ^1.4.1` |
| **Alertas modales** | **SweetAlert2** | `sweetalert2 ^11.26.25` (estilizado con clases corporativas premium) |
| **Estilos** | **SCSS modular** | `src/styles/` (`_tokens`, `_base`, `_components`, `_shell`, `_mixins`) |
| **Pruebas unitarias** | **Jest + Jest Preset Angular** | `jest ^30.5.2`, `jest-preset-angular ^17.0.3`, `ts-jest ^29.4.15` |
| **Linter & formatter** | **Biome 2** | `@biomejs/biome ^2.6.4` (`biome.json`) |
| **Despliegue** | **Cloudflare Pages** | `public/_headers` con CSP, cache inmutable y SSL estricto |

## 4. Estructura del código

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
├── login/          # /login · components/login, services/ (AuthService, AuthInterceptor)
├── dashboard/      # /dashboard · panel-control, resumen-activos, alertas
├── activo/         # /gestion-activos · lista-activos, detalle-activo, agregar-activo,
│                   # editar-activo, historial-activo, application/, infrastructure/, service/
├── asignacion/     # /asignaciones · lista-asignaciones, asignar-activo, editar-asignacion,
│                   # activos-asignados, activos-disponibles, services/
├── licencia/       # /licencias · lista-licencias, detalle-licencia,
│                   # dialogs/ (asignar-asiento, renovar-licencia), services/
├── mantenimiento/  # /mantenimientos · lista-mantenimientos, detalle-mantenimiento,
│                   # dialogs/ (abrir-mantenimiento, cerrar-mantenimiento), services/
├── solicitud/      # /solicitudes · lista-solicitudes, detalle-solicitud,
│                   # dialogs/ (nueva, decisión y entrega), services/
├── incidencia/     # /incidencias · lista-incidencias, detalle-incidencia,
│                   # dialogs/ (reportar-incidencia, generar-mantenimiento), services/
├── reporte/        # /reportes · reporte/ (filtros, Chart.js, PDF), service/
├── usuario/        # /usuarios · lista-usuarios, dialogs/usuario-form-dialog, services/
└── configuracion/  # /configuracion · configuracion-aplicacion/, services/
```

## 5. Arquitectura y flujo de datos

La aplicación usa carga perezosa (**lazy loading**) para optimizar el tiempo de carga inicial.

### 5.1 Guards y roles

- `AuthGuard`: exige sesión válida; redirige a `/login`.
- `RoleGuard`: lee `data.expectedRoles` (arreglo) o `data.expectedRole` (texto), valida con `hasAnyRole()` y muestra un SweetAlert de acceso denegado.
- Rutas con roles: `dashboard`, `mantenimientos` y `reportes` (Administrador, Técnico, Almacén); `usuarios` (Administrador).
- Redirección por defecto: `"" → login`; acceso denegado → `/gestion-activos` para empleados, `/dashboard` para el resto.

### 5.2 Patrón facade + repository

- **`application/*.facade.ts`**: estado y casos de uso con `signal`/`computed` + `injectQuery`/`injectMutation`. Es lo que consumen los componentes.
- **`infrastructure/*.repository.ts`**: única capa que habla con la API (`HttpClient`).
- **Componentes**: no inyectan `HttpClient` directamente; consumen facades o servicios del módulo.

### 5.3 Servicios clave

| Servicio | Ruta | Responsabilidad |
| :--- | :--- | :--- |
| `AuthService` | `src/app/login/services/auth.service.ts` | `authToken` y `user` en `localStorage`; `authMessage` en `sessionStorage`. Expone `user$` (BehaviorSubject) y `onLogout()` (Subject). Métodos: `login()`, `saveToken()`, `logout(motivo?)`, `logoutAll()`, `isLoggedIn()`, `hasRole()`, `hasAnyRole()`, `isAdmin()`, `isEmpleado()`. `AuthInterceptor` adjunta el JWT a las peticiones salientes. |
| `ThemeService` | `src/app/shared/services/theme.service.ts` | Tipo `Theme = "light" \| "dark" \| "system"`. Signals `theme`, `resolvedTheme` e `isDark` (computed). Persiste en `localStorage` (`nemi-theme`) y escucha `prefers-color-scheme` cuando el tema es `system`. Aplica o remueve `dark-mode` en `document.body`; `current` se mantiene por compatibilidad. |
| `NotificationService` | `src/app/shared/services/notification.service.ts` | Consulta alertas del backend (`licencia_proxima`, `garantia_proxima`, `devolucion_proxima`, incidencias, mantenimientos y solicitudes). Alimenta `alertasList$` y `totalAlerts$` para el badge y el menú del Header. |
| `PreferenciasService` | `src/app/core/preferencias/preferencias.service.ts` | Obtiene la zona horaria de negocio desde `/configuracion/ajustes`; `fechaHoy()` devuelve `YYYY-MM-DD` en esa zona, no en la del navegador. |
| `queryClient` | `src/app/core/query/query-client.ts` | `staleTime` 30s, `gcTime` 5min, `retry: 1`, sin refetch al enfocar; mutaciones sin retry. Se registra en `AppModule` con `provideTanStackQuery(queryClient)`. |

## 6. Variables de entorno

| Archivo | `production` | `apiUrl` |
| :--- | :--- | :--- |
| `src/environments/environment.ts` | `false` | `http://localhost:3030/api` |
| `src/environments/environment.prod.ts` | `true` | `https://nemi-api.fluxdv.icu/api` |

Los assets públicos (avatares, imágenes) se resuelven con `src/app/utils/images.ts` contra `https://assets.mgdc.site/nemi/`; ya no existe `r2PublicUrl` en los environments.

## 7. Comandos

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

# Verificación y formato con Biome
bun run check

# Solo el linter
bun run lint

# Solo el formateador
bun run format
```

## 8. Convenciones y reglas críticas

### 8.1 Código y UI

1. **Consistencia de tema (dark/light):** toda vista, tabla, modal o formulario debe usar las variables semánticas de `src/styles/_tokens.scss` (`--bg`, `--surface`, `--text`, `--border`, `--primary`, etc.) y funcionar en ambos temas.
2. **Estado del servidor con TanStack Query:** la UI consume facades con signals; no añadas `HttpClient` directo en componentes ni lógica de caché manual.
3. **Validación de formularios:** usa `ReactiveFormsModule` con validaciones declarativas y mensajes de error accesibles.
4. **Pruebas unitarias:** si agregas o modificas un servicio o componente, actualiza su `.spec.ts` y verifica con `bun run test`. Reutiliza los proveedores de `src/testing/test-providers.ts`.
5. **Formato:** todo el código pasa por Biome (`bun run check`); no introduzcas estilos de formato distintos.

### 8.2 Seguridad y cabeceras (`public/_headers`)

El archivo `public/_headers` se sincroniza con Cloudflare Pages en cada despliegue. La CSP define:

- `default-src 'self';`
- Scripts: `self`, `'unsafe-inline'`, `'unsafe-eval'`, `static.cloudflareinsights.com`, `challenges.cloudflare.com`, `code.iconify.design`.
- Estilos: `self`, `'unsafe-inline'`, `fonts.googleapis.com`, `challenges.cloudflare.com`.
- Imágenes: `self`, `data:`, `https:`, `https://assets.mgdc.site`, `https://nemi-api.fluxdv.icu`.
- Conexiones: `self`, `http://localhost:*`, `cloudflareinsights.com`, `challenges.cloudflare.com`, `nemi-api.fluxdv.icu`, `api.iconify.design`, `api.simplesvg.com`, `api.unisvg.com`.
- `frame-ancestors 'none'`, `object-src 'none'` y `upgrade-insecure-requests`.

No relajes la CSP sin revisar qué recurso externo la necesita.

## 9. Flujo de Git y despliegue

### 9.1 Git

- **Prohibido** ejecutar `git commit` o `git push` sin la aprobación explícita del usuario.
- El desarrollo va en `develop`; el merge a `main` solo se hace con aprobación.
- Mensajes de commit con *Conventional Commits*, en minúsculas y en español (`feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`).

### 9.2 Despliegue y cache

El despliegue es en **Cloudflare Pages** con `public/_headers`, que define:

- `/index.html` y `/*.html`: `public, max-age=0, s-maxage=3600, must-revalidate`.
- `/assets/*.js`, `/*.js`, `/assets/*.css`, `/*.css`, `*.woff2`, `*.woff`: `public, max-age=31536000, s-maxage=2592000, immutable`.
- Imágenes (`png`, `jpg`, `jpeg`, `svg`, `webp`, `avif`, `ico`): `public, max-age=31536000, s-maxage=604800`.
- `manifest.json` y `sw.js`: `max-age=0, must-revalidate`.

## 10. CI/CD

`.github/workflows/ci-cd.yml` ejecuta jobs paralelos `lint` (Biome CI) y `test` (Jest). El job `deploy` corre solo en push a `main` con:

```bash
# Publica el build en Cloudflare Pages
bunx wrangler pages deploy dist/nemi/browser --project-name=nemi --branch=main
```
