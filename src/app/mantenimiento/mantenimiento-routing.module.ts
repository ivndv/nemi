import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DetalleMantenimientoComponent } from "./detalle-mantenimiento/detalle-mantenimiento.component";
import { ListaMantenimientosComponent } from "./lista-mantenimientos/lista-mantenimientos.component";

const routes: Routes = [
	{ path: "", component: ListaMantenimientosComponent },
	{ path: ":id", component: DetalleMantenimientoComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class MantenimientoRoutingModule {}
