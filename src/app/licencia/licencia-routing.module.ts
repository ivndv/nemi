import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DetalleLicenciaComponent } from "./detalle-licencia/detalle-licencia.component";
import { ListaLicenciasComponent } from "./lista-licencias/lista-licencias.component";

const routes: Routes = [
	{ path: "", component: ListaLicenciasComponent },
	{ path: ":id", component: DetalleLicenciaComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class LicenciaRoutingModule {}
