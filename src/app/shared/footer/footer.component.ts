import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-footer",
	standalone: true,
	imports: [],
	templateUrl: "./footer.component.html",
	styleUrl: "./footer.component.css",
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FooterComponent {}
