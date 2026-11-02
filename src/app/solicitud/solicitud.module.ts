import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AdjuntosModule } from "../shared/adjuntos/adjuntos.module";
import { FechaAppPipe } from "../shared/pipes/fecha-app.pipe";
import { DetalleSolicitudComponent } from "./detalle-solicitud/detalle-solicitud.component";
import { ListaSolicitudesComponent } from "./lista-solicitudes/lista-solicitudes.component";
import { SolicitudRoutingModule } from "./solicitud-routing.module";

@NgModule({
	declarations: [ListaSolicitudesComponent, DetalleSolicitudComponent],
	imports: [CommonModule, AdjuntosModule, SolicitudRoutingModule, FechaAppPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SolicitudModule {}
