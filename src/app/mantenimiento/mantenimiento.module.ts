import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AdjuntosModule } from "../shared/adjuntos/adjuntos.module";
import { DetalleMantenimientoComponent } from "./detalle-mantenimiento/detalle-mantenimiento.component";
import { ListaMantenimientosComponent } from "./lista-mantenimientos/lista-mantenimientos.component";
import { MantenimientoRoutingModule } from "./mantenimiento-routing.module";

@NgModule({
	declarations: [ListaMantenimientosComponent, DetalleMantenimientoComponent],
	imports: [CommonModule, AdjuntosModule, MantenimientoRoutingModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MantenimientoModule {}
