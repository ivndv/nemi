import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-asignaciones",
	standalone: false,
	templateUrl: "./lista-asignaciones.component.html",
	styleUrl: "./lista-asignaciones.component.css",
})
export class ListaAsignacionesComponent {}
