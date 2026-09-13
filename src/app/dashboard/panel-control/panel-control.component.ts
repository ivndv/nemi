import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-panel-control",
	standalone: false,
	templateUrl: "./panel-control.component.html",
	styleUrl: "./panel-control.component.css",
})
export class PanelControlComponent {}
