import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { FechaAppPipe } from "../shared/pipes/fecha-app.pipe";
import { ReporteComponent } from "./reporte/reporte.component";
import { ReporteRoutingModule } from "./reporte-routing.module";

@NgModule({
	declarations: [ReporteComponent],
	imports: [
		CommonModule,
		ReporteRoutingModule,
		NgSelectModule,
		ReactiveFormsModule,
		FechaAppPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReporteModule {}
