import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { AdjuntosModule } from "../shared/adjuntos/adjuntos.module";
import { FechaAppPipe } from "../shared/pipes/fecha-app.pipe";
import { ActivoRoutingModule } from "./activo-routing.module";
import { AgregarActivoComponent } from "./agregar-activo/agregar-activo.component";
import { ActivoDetalleFacade } from "./application/activo-detalle.facade";
import { ActivosFacade } from "./application/activos.facade";
import { ActivosMutacionesFacade } from "./application/activos-mutaciones.facade";
import { DetalleActivoComponent } from "./detalle-activo/detalle-activo.component";
import { EditarActivoComponent } from "./editar-activo/editar-activo.component";
import { HistorialActivoComponent } from "./historial-activo/historial-activo.component";
import {
	ActivosHttpRepository,
	ActivosRepository,
} from "./infrastructure/activos.repository";
import { ListaActivosComponent } from "./lista-activos/lista-activos.component";

@NgModule({
	declarations: [
		ListaActivosComponent,
		DetalleActivoComponent,
		HistorialActivoComponent,
		AgregarActivoComponent,
		EditarActivoComponent,
	],
	imports: [
		CommonModule,
		AdjuntosModule,
		ActivoRoutingModule,
		ReactiveFormsModule,
		NgSelectModule,
		FechaAppPipe,
	],
	providers: [
		ActivosFacade,
		ActivoDetalleFacade,
		ActivosMutacionesFacade,
		{ provide: ActivosRepository, useExisting: ActivosHttpRepository },
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ActivoModule {}
