import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { AuthService } from "../../login/services/auth.service";
import { ActivoDetalleFacade } from "../application/activo-detalle.facade";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-detalle-activo",
	standalone: false,
	templateUrl: "./detalle-activo.component.html",
	styleUrl: "./detalle-activo.component.css",
})
export class DetalleActivoComponent implements OnInit {
	private readonly facade = inject(ActivoDetalleFacade);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly authService = inject(AuthService);
	private lastError = "";

	constructor() {
		effect(() => {
			const message = this.facade.errorMessage();
			if (!message || message === this.lastError) return;

			this.lastError = message;
			Swal.fire({
				title: "Error",
				text: message,
				icon: "error",
				buttonsStyling: false,
				customClass: {
					popup: "premium-swal-popup",
					title: "premium-swal-title",
					htmlContainer: "premium-swal-html",
					confirmButton: "premium-swal-confirm",
				},
			});
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get("id") ?? 0);
		this.facade.setActivoId(id);
	}

	get activo() {
		return this.facade.activo();
	}

	get errorMessage(): string {
		return this.facade.errorMessage();
	}

	async darDeBaja(): Promise<void> {
		const activo = this.activo;
		if (!activo) return;

		const result = await Swal.fire({
			title: "¿Dar de baja?",
			text: `¿Estás seguro de dar de baja el activo "${activo.nombre}"? Esta acción no se puede deshacer.`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sí, dar de baja",
			cancelButtonText: "Cancelar",
			reverseButtons: true,
			buttonsStyling: false,
			customClass: {
				popup: "premium-swal-popup",
				title: "premium-swal-title",
				htmlContainer: "premium-swal-html",
				confirmButton: "premium-swal-confirm",
				cancelButton: "premium-swal-cancel",
			},
		});

		if (!result.isConfirmed) return;

		try {
			await this.facade.darDeBaja();

			await Swal.fire({
				title: "Baja exitosa",
				text: "El activo ha sido retirado del sistema.",
				icon: "success",
				timer: 2000,
				timerProgressBar: true,
				buttonsStyling: false,
				customClass: {
					popup: "premium-swal-popup",
					title: "premium-swal-title",
					htmlContainer: "premium-swal-html",
					confirmButton: "premium-swal-confirm",
				},
			});

			this.router.navigate(["/gestion-activos"]);
		} catch (error) {
			Swal.fire({
				title: "Error",
				text: getHttpErrorMessage(error, "Error al dar de baja"),
				icon: "error",
				buttonsStyling: false,
				customClass: {
					popup: "premium-swal-popup",
					title: "premium-swal-title",
					htmlContainer: "premium-swal-html",
					confirmButton: "premium-swal-confirm",
				},
			});
		}
	}

	editarActivo(): void {
		const activo = this.activo;
		if (!activo) return;
		this.router.navigate(["/gestion-activos/editar", activo.id]);
	}

	verHistorial(): void {
		const activo = this.activo;
		if (!activo) return;
		this.router.navigate(["/gestion-activos/historial", activo.id]);
	}

	isAdmin(): boolean {
		return this.authService.isAdmin();
	}

	puedeOperar(): boolean {
		return this.authService.puedeOperar();
	}

	puedeMantenimiento(): boolean {
		return this.authService.puedeMantenimiento();
	}

	getAssetPhoto(fotoUrl: string): string {
		return fotoUrl || "";
	}

	trackById(_index: number, item: { id: number }): number {
		return item.id;
	}
}
