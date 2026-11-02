import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DetalleSolicitudComponent } from "./detalle-solicitud/detalle-solicitud.component";
import { ListaSolicitudesComponent } from "./lista-solicitudes/lista-solicitudes.component";

const routes: Routes = [
	{ path: "", component: ListaSolicitudesComponent },
	{ path: ":id", component: DetalleSolicitudComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class SolicitudRoutingModule {}
