import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RoleGuard } from "../services/role-guard.service";
import { AsignarActivoComponent } from "./asignar-activo/asignar-activo.component";
import { EditarAsignacionComponent } from "./editar-asignacion/editar-asignacion.component";
// Componentes del módulo
import { ListaAsignacionesComponent } from "./lista-asignaciones/lista-asignaciones.component";

// Definición de las rutas
const routes: Routes = [
	{ path: "", component: ListaAsignacionesComponent }, // Ruta principal (/asignaciones)
	{
		path: "asignar/:id",
		component: AsignarActivoComponent,
		canActivate: [RoleGuard],
		data: { expectedRoles: ["Administrador", "Técnico", "Almacén"] },
	}, // Ruta independiente (/asignaciones/asignar)
	{
		path: "editar/:id",
		component: EditarAsignacionComponent,
		canActivate: [RoleGuard],
		data: { expectedRoles: ["Administrador", "Técnico", "Almacén"] },
	}, // Ruta independiente (/asignaciones/editar/:id)
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AsignacionRoutingModule {}
