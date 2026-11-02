import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AdjuntosModule } from "../shared/adjuntos/adjuntos.module";
import { FechaAppPipe } from "../shared/pipes/fecha-app.pipe";
import { DetalleIncidenciaComponent } from "./detalle-incidencia/detalle-incidencia.component";
import { IncidenciaRoutingModule } from "./incidencia-routing.module";
import { ListaIncidenciasComponent } from "./lista-incidencias/lista-incidencias.component";

@NgModule({
	declarations: [ListaIncidenciasComponent, DetalleIncidenciaComponent],
	imports: [
		CommonModule,
		AdjuntosModule,
		IncidenciaRoutingModule,
		FechaAppPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IncidenciaModule {}
