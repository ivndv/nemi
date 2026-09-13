import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { AuthService } from "../../login/services/auth.service";
import { ActivoDetalleResponse } from "../../models/activo.interface";
import { getCloudflareImage } from "../../utils/images";
import { ActivoService } from "../service/activo.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-detalle-activo",
	standalone: false,
	templateUrl: "./detalle-activo.component.html",
	styleUrl: "./detalle-activo.component.css",
})
export class DetalleActivoComponent implements OnInit {
	activo: ActivoDetalleResponse["data"] | null = null;
	errorMessage: string = "";

	activoId!: number; // ID del activo
	private destroy$ = new Subject<void>();

	constructor(
		private route: ActivatedRoute,
		private activoService: ActivoService,
		private router: Router,
		private authService: AuthService,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		// Obtener el ID del activo desde la ruta
		this.activoId = +(this.route.snapshot.paramMap.get("id") || 0);

		// Cargar el activo al inicializar el componente
		this.cargarActivo();
	}

	// Método para cargar el activo por ID desde la URL
	cargarActivo(): void {
		this.activoService
			.getActivoById(this.activoId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.activo = {
						...response.data,
						garantia: response.data.garantia ?? [],
					};
					this.cdr.markForCheck();
					console.log("Activo cargado correctamente:", this.activo);
				},
				error: (error) => {
					const errorMessage =
						error.error?.error || "Error al obtener el activo";
					this.errorMessage = errorMessage;
					console.error("Error del backend:", errorMessage);
					Swal.fire({
						title: "Error",
						text: errorMessage,
						icon: "error",
						buttonsStyling: false,
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
							htmlContainer: "premium-swal-html",
							confirmButton: "premium-swal-confirm",
						},
					});
				},
			});
	}

	darDeBaja(): void {
		if (!this.activo) {
			console.error("No se puede dar de baja: Activo no cargado.");
			return;
		}

		const activoId = this.activo.id;
		const activoNombre = this.activo.nombre;

		Swal.fire({
			title: "¿Dar de Baja?",
			text: `¿Estás seguro de dar de baja el activo "${activoNombre}"? Esta acción no se puede deshacer.`,
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
		}).then((result) => {
			if (result.isConfirmed) {
				this.activoService
					.darDeBajaActivo(activoId)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (_response) => {
							this.cdr.markForCheck();
							Swal.fire({
								title: "¡Baja Exitosa!",
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
							}).then(() => {
								this.router.navigate(["/gestion-activos"]);
							});
						},
						error: (error) => {
							const errorMessage =
								error.error?.message || "Error al dar de baja";
							Swal.fire({
								title: "Error",
								text: errorMessage,
								icon: "error",
								buttonsStyling: false,
								customClass: {
									popup: "premium-swal-popup",
									title: "premium-swal-title",
									htmlContainer: "premium-swal-html",
									confirmButton: "premium-swal-confirm",
								},
							});
						},
					});
			}
		});
	}

	editarActivo(): void {
		if (!this.activo) return;
		this.router.navigate(["/gestion-activos/editar", this.activo.id]);
	}

	verHistorial(): void {
		if (!this.activo) return;
		this.router.navigate(["/gestion-activos/historial", this.activo.id]);
	}

	isAdmin(): boolean {
		return this.authService.isAdmin();
	}

	getAssetPhoto(fotoUrl: string): string {
		return getCloudflareImage(fotoUrl, { width: 600 });
	}

	trackById(_index: number, item: { id: number }): number {
		return item.id;
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
