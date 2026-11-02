import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AdjuntosModule } from "../shared/adjuntos/adjuntos.module";
import { DetalleLicenciaComponent } from "./detalle-licencia/detalle-licencia.component";
import { LicenciaRoutingModule } from "./licencia-routing.module";
import { ListaLicenciasComponent } from "./lista-licencias/lista-licencias.component";

@NgModule({
	declarations: [ListaLicenciasComponent, DetalleLicenciaComponent],
	imports: [CommonModule, AdjuntosModule, LicenciaRoutingModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LicenciaModule {}
