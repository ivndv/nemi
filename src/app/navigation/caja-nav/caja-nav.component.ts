import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-caja-nav",
	standalone: false,
	templateUrl: "./caja-nav.component.html",
	styleUrl: "./caja-nav.component.css",
})
export class CajaNavComponent {
	@Input() label!: string; // Texto del botón
	@Input() route!: string; // Ruta del botón
	@Input() icon?: string; // Ícono opcional (ruta de la imagen)
	@Input() iconify?: string; // Ícono opcional de Iconify (ph:...)

	// Proporciona un valor predeterminado para evitar 'undefined'
	@Input() routerLinkActive: string = "active";
}
