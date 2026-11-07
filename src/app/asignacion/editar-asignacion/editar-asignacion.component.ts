import { Location } from "@angular/common";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { CatalogosFacade } from "../../core/catalogos/catalogos.facade";

const EMPTY_ITEMS: { id: number; nombre: string }[] = [];

import {
	AsignacionData,
	AsignacionPayload,
} from "../../models/asignacion.interface";
import { AsignacionService } from "../services/asignacion.service";
import { AuxiliaresService } from "../services/auxiliares.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-editar-asignacion",
	standalone: false,
	templateUrl: "./editar-asignacion.component.html",
	styleUrl: "./editar-asignacion.component.css",
})
export class EditarAsignacionComponent implements OnInit, OnDestroy {
	// Propiedades para almacenar datos
	activoId!: number; // ID del activo
	nombreActivo: string = "";
	get usuarios(): { id: number; nombre: string }[] {
		return this.catalogosFacade.catalogos()?.usuarios ?? EMPTY_ITEMS;
	}

	get ubicaciones(): { id: number; nombre: string }[] {
		return this.catalogosFacade.catalogos()?.ubicaciones ?? EMPTY_ITEMS;
	}
	asignacionData: AsignacionData | null = null;

	// FormGroup para el formulario
	asignacionForm!: FormGroup;

	// Variable para manejar mensajes de error
	errorMessage: string = "";
	fotoActivo: string | null = null;

	idAsignacion: number = 0; // ID de la asignación
	private destroy$ = new Subject<void>();

	constructor(
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,
		private router: Router,
		private fb: FormBuilder,
		private auxiliaresService: AuxiliaresService,
		private asignacionService: AsignacionService,
		private catalogosFacade: CatalogosFacade,
		private location: Location,
	) {}

	ngOnInit(): void {
		this.activoId = +(this.route.snapshot.paramMap.get("id") || 0);

		this.inicializarFormulario();

		this.cargarDatosAsignacion();

		this.cargarDatosAdicionales();
	}

	inicializarFormulario(): void {
		this.asignacionForm = this.fb.group({
			nombre: ["", Validators.required],
			usuario_id: [""],
			ubicacion_id: [""],
			fecha_asignacion: [""],
			fecha_devolucion: [""],
			comentarios: [""],
		});
	}

	cargarDatosAsignacion(): void {
		this.asignacionService
			.getAsignacionPorId(this.activoId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.asignacionData = response.data;
					this.fotoActivo = this.asignacionData.foto_url;
					this.idAsignacion = this.asignacionData.id;
					this.asignacionForm.patchValue({
						nombre: this.asignacionData.nombre,
						usuario_id: this.asignacionData.usuario_id,
						ubicacion_id: this.asignacionData.ubicacion_id,
						fecha_asignacion: this.asignacionData.fecha_asignacion
							? this.asignacionData.fecha_asignacion.split("T")[0]
							: undefined,
						fecha_devolucion: this.asignacionData.fecha_devolucion
							? this.asignacionData.fecha_devolucion.split("T")[0]
							: undefined,
						comentarios: this.asignacionData.comentarios,
					});
					this.cdr.markForCheck();
				},
				error: (error) => {
					const errorMessage =
						error.error?.mensaje ||
						"Error al obtener los datos de la asignación";

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

	cargarDatosAdicionales(): void {
		this.auxiliaresService
			.getDatosAuxiliares(this.activoId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (_response) => {
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al cargar datos auxiliares" }
					const errorMessage =
						error.error?.error || "Error al cargar datos auxiliares";

					// Mostrar el mensaje
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

	onSubmit(): void {
		if (this.asignacionForm.valid) {
			const formValue = this.asignacionForm.value;

			const payload: AsignacionPayload = {};
			for (const key in formValue) {
				if (formValue[key] !== null && formValue[key] !== "") {
					payload[key as keyof AsignacionPayload] = formValue[key];
				}
			}

			this.asignacionService
				.updateAsignacion(this.activoId, payload)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (_response) => {
						Swal.fire({
							title: "¡Éxito!",
							text: "Asignación actualizada correctamente.",
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
							this.router.navigate(["/asignaciones"]);
						});
					},
					error: (error) => {
						const errorMessage =
							error.error?.error || "Error al actualizar la asignación";

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
		} else {
			console.error("El formulario no es válido.");
			Swal.fire({
				title: "Formulario Invalido",
				text: "Por favor, completa todos los campos requeridos.",
				icon: "warning",
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

	// Método para eliminar la asignación
	eliminarAsignacion(): void {
		Swal.fire({
			title: "¿Eliminar Asignación?",
			text: "¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sí, eliminar",
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
				this.asignacionService
					.deleteAsignacion(this.idAsignacion)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (_response) => {
							Swal.fire({
								title: "¡Eliminada!",
								text: "La asignación ha sido eliminada correctamente.",
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
								this.asignacionForm.reset();
								this.router.navigate(["/asignaciones"]);
							});
						},
						error: (error) => {
							const errorMessage =
								error.error?.error || "Error al eliminar la asignación";
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

	cancelarEdicion(showAlert: boolean = true): void {
		if (showAlert) {
			Swal.fire({
				title: "¿Cancelar?",
				text: "¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.",
				icon: "question",
				showCancelButton: true,
				confirmButtonText: "Sí, cancelar",
				cancelButtonText: "No, continuar",
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
					this.asignacionForm.reset();
					this.location.back();
				}
			});
		} else {
			this.asignacionForm.reset();
			this.location.back();
		}
	}

	getAssetPhoto(fotoUrl: string | null | undefined): string {
		if (!fotoUrl) return "";
		return fotoUrl;
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
