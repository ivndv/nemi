import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FechaAppPipe } from "../pipes/fecha-app.pipe";
import { AdjuntosComponent } from "./adjuntos.component";

@NgModule({
	declarations: [AdjuntosComponent],
	imports: [CommonModule, FechaAppPipe],
	exports: [AdjuntosComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdjuntosModule {}
