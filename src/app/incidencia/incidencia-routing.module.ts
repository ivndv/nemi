import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DetalleIncidenciaComponent } from "./detalle-incidencia/detalle-incidencia.component";
import { ListaIncidenciasComponent } from "./lista-incidencias/lista-incidencias.component";

const routes: Routes = [
	{ path: "", component: ListaIncidenciasComponent },
	{ path: ":id", component: DetalleIncidenciaComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class IncidenciaRoutingModule {}
