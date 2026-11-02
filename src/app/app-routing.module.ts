import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "./services/auth-guard.service";
import { RoleGuard } from "./services/role-guard.service";

const routes: Routes = [
	{
		path: "login",
		title: "Iniciar Sesión | Gestor de Activos",
		loadChildren: () =>
			import("./login/login.module").then((m) => m.LoginModule),
	},
	{
		path: "dashboard",
		title: "Panel de Control | Gestor de Activos",
		loadChildren: () =>
			import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
		canActivate: [AuthGuard, RoleGuard],
		data: { expectedRoles: ["Administrador", "Técnico", "Almacén"] },
	},
	{
		path: "gestion-activos",
		title: "Inventario de Activos | Gestor de Activos",
		loadChildren: () =>
			import("./activo/activo.module").then((m) => m.ActivoModule),
		canActivate: [AuthGuard],
	},
	{
		path: "licencias",
		title: "Licencias | Gestor de Activos",
		loadChildren: () =>
			import("./licencia/licencia.module").then((m) => m.LicenciaModule),
		canActivate: [AuthGuard],
	},
	{
		path: "asignaciones",
		title: "Asignaciones | Gestor de Activos",
		loadChildren: () =>
			import("./asignacion/asignacion.module").then((m) => m.AsignacionModule),
		canActivate: [AuthGuard],
	},
	{
		path: "mantenimientos",
		title: "Mantenimientos | Gestor de Activos",
		loadChildren: () =>
			import("./mantenimiento/mantenimiento.module").then(
				(m) => m.MantenimientoModule,
			),
		canActivate: [AuthGuard, RoleGuard],
		data: { expectedRoles: ["Administrador", "Técnico"] },
	},
	{
		path: "solicitudes",
		title: "Solicitudes | Gestor de Activos",
		loadChildren: () =>
			import("./solicitud/solicitud.module").then((m) => m.SolicitudModule),
		canActivate: [AuthGuard],
	},
	{
		path: "incidencias",
		title: "Incidencias | Gestor de Activos",
		loadChildren: () =>
			import("./incidencia/incidencia.module").then((m) => m.IncidenciaModule),
		canActivate: [AuthGuard],
	},
	{
		path: "reportes",
		title: "Reportes Gerenciales | Gestor de Activos",
		loadChildren: () =>
			import("./reporte/reporte.module").then((m) => m.ReporteModule),
		canActivate: [AuthGuard, RoleGuard],
		data: { expectedRoles: ["Administrador", "Técnico", "Almacén"] },
	},
	{
		path: "usuarios",
		title: "Usuarios | Gestor de Activos",
		loadChildren: () =>
			import("./usuario/usuario.module").then((m) => m.UsuarioModule),
		canActivate: [AuthGuard, RoleGuard],
		data: { expectedRoles: ["Administrador"] },
	},
	{
		path: "configuracion",
		title: "Configuración | Gestor de Activos",
		loadChildren: () =>
			import("./configuracion/configuracion.module").then(
				(m) => m.ConfiguracionModule,
			),
		canActivate: [AuthGuard],
	},

	{ path: "", redirectTo: "login", pathMatch: "full" },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
