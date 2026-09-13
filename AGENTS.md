# AGENTS.md — Guía para Agentes en Nemi Frontend (`nemi`)

Guía operativa, arquitectónica y técnica para agentes de Inteligencia Artificial que colaboren en el desarrollo, mantenimiento y optimización del frontend de **Nemi** (`nemi`).

---

## 1. Visión General del Proyecto

**Nemi Frontend** es una Single Page Application (SPA) corporativa construida en **Angular 19**, diseñada para la gestión, auditoría, asignación y rastreo de activos tecnológicos (hardware, software, licencias y garantías) en tiempo real.

* **Propósito:** Interfaz administrativa intuitiva, reactiva y segura con soporte de roles (RBAC), modo claro/oscuro dinámico, reportes analíticos con gráficas interactivas y exportación en PDF.
* **Dominio Frontend en Producción:** [https://nemi.mgdc.site](https://nemi.mgdc.site)
* **Backend API:** [https://nemi-api.fluxdv.icu](https://nemi-api.fluxdv.icu) (ver [AGENTS.md del Backend](file:///home/ivan/software-dev/nemi-api/AGENTS.md))
* **Assets en Cloudflare R2:** [https://assets.mgdc.site/nemi/](https://assets.mgdc.site/nemi/)
* **Repositorio en GitHub:** [https://github.com/ivndv/nemi](https://github.com/ivndv/nemi)

---

## 2. Antes de Tocar Código (Contexto con CodeGraph)

Este proyecto cuenta con un grafo de conocimiento indexado con **CodeGraph** (107 archivos, >1,100 nodos).

* **Uso del MCP CodeGraph:** Antes de realizar búsquedas masivas de texto (`grep`), listar directorios o leer múltiples archivos a ciegas, invoca la herramienta MCP `codegraph_explore` indicando:
  ```json
  {
    "projectPath": "/home/ivan/software-dev/nemi",
    "query": "tu consulta de arquitectura, componente o flujo"
  }
  ```
  Te proveerá el grafo de dependencias, blast radius y código verbatim de los componentes y servicios en una sola llamada eficiente.
* **Sincronización del Índice:**
  Si creas o renombras componentes/módulos, sincroniza el índice ejecutando:
  ```bash
  codegraph sync /home/ivan/software-dev/nemi
  ```

---

## 3. Stack Tecnológico

| Capa | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Framework SPA** | **Angular 19** | `@angular/core ^19.2.25`, Angular CLI `^19.2.27` |
| **Runtime & Gestor** | **Bun** | Bun `v1.3.x` (`bun.lock`) |
| **Lenguaje** | **TypeScript** | `typescript ~5.7.3` (Modo estricto ESM) |
| **UI & Componentes** | **Angular Material + CDK** | `@angular/material ^19.2.19`, `@angular/cdk ^19.2.19` |
| **Iconografía** | **Iconify** | `iconify-icon ^3.0.2` (Web Components con prefijo `ph:` de Phosphor Icons) |
| **Selects Avanzados** | **Ng-Select** | `@ng-select/ng-select ^14.2.8` |
| **Gráficas** | **Chart.js** | `chart.js ^4.4.9` (Gráficas de pastel y barras en reportes) |
| **Generación de PDFs**| **jsPDF + html2canvas** | `jspdf ^3.0.1`, `jspdf-autotable ^5.0.2`, `html2canvas ^1.4.1` |
| **Alertas Modales** | **SweetAlert2** | `sweetalert2 ^11.26.24` (Estilizado con clases corporativas premium) |
| **Pruebas Unitarias** | **Jest + Jest Preset Angular** | `jest ^29.7.0`, `jest-preset-angular ^14.6.2`, `ts-jest ^29.4.12` |
| **Linter & Formatter**| **Biome 2** | `@biomejs/biome ^2.5.13` (`biome.json`) |
| **Despliegue** | **Cloudflare Pages** | Configurado en `public/_headers` con CSP, cache inmutable y SSL estricto |

---

## 4. Arquitectura de Módulos y Enrutamiento

La aplicación utiliza carga perezosa (**Lazy Loading**) para optimizar el rendimiento y tiempo de carga inicial:

```
src/app/
├── login/               # Módulo de Autenticación (/login)
│   ├── components/login # Vista de Login, form reactivo, theme toggle flotante
│   └── services/        # AuthService (JWT, localStorage, roles)
├── dashboard/           # Módulo Dashboard (/dashboard)
│   ├── panel-control/   # Vista principal con métricas y KPIs
│   ├── resumen-activos/ # Tarjetas de conteo de activos por estado
│   └── alertas/         # Alertas de vencimiento de garantías y licencias
├── activo/              # Módulo Gestión de Activos (/gestion-activos)
│   ├── lista-activos/   # Tabla paginada con filtros múltiples
│   ├── detalle-activo/  # Ficha técnica completa del activo
│   ├── agregar-activo/  # Formulario reactivo para alta con carga de foto R2
│   ├── editar-activo/   # Edición de especificaciones y garantías
│   └── historial-activo/# Timeline y trazabilidad de acciones
├── asignacion/          # Módulo Asignaciones (/asignaciones)
│   ├── lista-asignaciones/ # Asignaciones vigentes
│   ├── asignar-activo/     # Asignación a usuario y departamento
│   └── editar-asignacion/  # Devolución y reasignación
├── reporte/             # Módulo Reportes (/reportes)
│   └── reporte/         # Generador de reportes con filtros, Chart.js y exportación PDF
├── configuracion/       # Módulo Configuración (/configuracion)
├── navigation/          # Barra lateral (Navbar) y enlaces de navegación
└── shared/              # Componentes y Servicios Globales
    ├── header/          # Encabezado global (Theme toggle, notificaciones, perfil)
    ├── footer/          # Pie de página
    └── services/        # ThemeService, NotificationService
```

---

## 5. Servicios Clave y Patrones

### `AuthService` (`src/app/login/services/auth.service.ts`)
* Maneja `authToken` y `user` en `localStorage`.
* Decodifica el payload JWT en base64 para evaluar expiración (`isLoggedIn()`).
* Métodos de autorización: `hasRole(role: string)` e `isAdmin(): boolean`.
* Emite eventos de logout a través de `logoutSubject: Subject<void>`.

### `ThemeService` (`src/app/shared/services/theme.service.ts`)
* Soporta `"light"` y `"dark"`.
* Persiste la preferencia en `localStorage.getItem("nemi-theme")`.
* Si no hay valor previo, detecta `prefers-color-scheme: dark`.
* Aplica o remueve dinámicamente la clase `dark-mode` en `document.body`.
* Expone `theme$: Observable<Theme>` y `current: Theme`.

### `NotificationService` (`src/app/shared/services/notification.service.ts`)
* Consulta los endpoints de alertas del backend (`licencia_proxima`, `garantia_proxima`, `devolucion_proxima`, etc.).
* Alimenta el contador numérico del badge y el menú desplegable de notificaciones del Header.

### `RoleGuard` & `AuthGuard` (`src/app/services/`)
* Protege las rutas administrativas (`canActivate: [RoleGuard]`, `data: { expectedRole: 'Administrador' }`).
* Redirige a `/login` si el token es nulo o expiró.

---

## 6. Variables de Entorno

* **Desarrollo (`src/environments/environment.ts`):**
  ```typescript
  export const environment = {
    production: false,
    apiUrl: "http://localhost:3000/api",
    r2PublicUrl: "https://assets.mgdc.site/nemi"
  };
  ```
* **Producción (`src/environments/environment.prod.ts`):**
  ```typescript
  export const environment = {
    production: true,
    apiUrl: "https://nemi-api.fluxdv.icu/api",
    r2PublicUrl: "https://assets.mgdc.site/nemi"
  };
  ```

---

## 7. Estándares de Seguridad y Despliegue (`public/_headers`)

El archivo `public/_headers` se sincroniza con Cloudflare Pages en cada despliegue:
* **CSP (Content-Security-Policy):**
  * `default-src 'self';`
  * Scripts permitidos: `self`, `static.cloudflareinsights.com`, `challenges.cloudflare.com`, `code.iconify.design`.
  * Imágenes permitidas: `self`, `data:`, `https:`, `https://assets.mgdc.site`, `https://nemi-api.fluxdv.icu`.
  * Conexiones permitidas: `self`, `http://localhost:*`, `https://nemi-api.fluxdv.icu`, `https://api.iconify.design`, Cloudflare Turnstile e Insights.
  * Directiva `upgrade-insecure-requests;` para forzar HTTPS estricto.
* **Cache Control:**
  * `/index.html` y `/*.html`: `public, max-age=0, s-maxage=3600, must-revalidate` (actualización inmediata post-deploy).
  * `/assets/*.js`, `/assets/*.css`, `/*.woff2`: `public, max-age=31536000, s-maxage=2592000, immutable`.
  * Imágenes: `public, max-age=31536000, s-maxage=604800`.

---

## 8. Comandos de Desarrollo y Testing

Todos los comandos se ejecutan desde `/home/ivan/software-dev/nemi`:

```bash
# Iniciar servidor de desarrollo local (puerto 4200 por defecto)
bun run start

# Compilar proyecto para producción (genera dist/nemi/browser)
bun run build

# Compilar en modo observación (development)
bun run watch

# Ejecutar suite de pruebas unitarias con Jest
bun run test

# Ejecutar pruebas en modo interactivo/watch
bun run test:watch

# Ejecutar linter y formateador Biome
bun run check

# Formatear código con Biome
bun run format

# Consultar arquitectura y símbolos con CodeGraph
codegraph
```

---

## 9. Reglas y Directrices para Agentes

1. **Usa CodeGraph MCP Primero:** Antes de modificar un servicio o componente, ejecuta `codegraph_explore` para identificar qué otros archivos y pruebas se verán afectados por el cambio.
2. **Consistencia de Tema (Dark/Light):** Toda nueva vista, tabla, modal o formulario debe soportar modo claro y modo oscuro utilizando variables CSS semánticas (`--color-surface`, `--color-bg`, `--color-heading`, `--color-border`) definidas en `src/styles.css`.
3. **Validación de Formularios:** Utiliza `ReactiveFormsModule` con validaciones declarativas y mensajes de error accesibles.
4. **Pruebas Unitarias:** Si agregas o modificas un servicio o componente, asegúrate de actualizar su archivo `.spec.ts` y verificar con `bun run test`.
5. **No Comitear sin Aprobación:** Nunca ejecutes `git commit` o `git push` sin la confirmación explícita del usuario.
