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
import { AsignacionPayload } from "../../models/asignacion.interface";
import { SelectItem } from "../../models/datos-auxiliares.interface";
import { AsignacionService } from "../services/asignacion.service";
import { AuxiliaresService } from "../services/auxiliares.service";

const EMPTY_ITEMS: SelectItem[] = [];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-asignar-activo",
	standalone: false,
	templateUrl: "./asignar-activo.component.html",
	styleUrl: "./asignar-activo.component.css",
})
export class AsignarActivoComponent implements OnInit, OnDestroy {
	// Variables para almacenar datos auxiliares
	id: number | null = null;

	get usuarios(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.usuarios ?? EMPTY_ITEMS;
	}

	get ubicaciones(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.ubicaciones ?? EMPTY_ITEMS;
	}

	// FormGroup para el formulario
	asignacionForm!: FormGroup;

	// Variable para manejar mensajes de error
	errorMessage: string = "";
	foto_url: string | null = null;
	private destroy$ = new Subject<void>();

	constructor(
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,
		private auxiliaresService: AuxiliaresService,
		private catalogosFacade: CatalogosFacade,
		private asignacionService: AsignacionService,
		private fb: FormBuilder,
		private router: Router,
		private location: Location,
	) {}

	ngOnInit(): void {
		this.inicializarFormulario();

		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			this.id = +params["id"];
			this.cdr.markForCheck();

			if (this.id) {
				this.cargarDatosAuxiliares(this.id);
			}
		});
	}

	inicializarFormulario(): void {
		this.asignacionForm = this.fb.group({
			nombre: [{ value: "", disabled: true }, Validators.required],
			usuario_id: ["", Validators.required],
			ubicacion_id: ["", Validators.required],
			fecha_asignacion: ["", Validators.required],
			fecha_devolucion: [""],
			comentarios: [""],
		});
	}

	cargarDatosAuxiliares(id: number): void {
		this.auxiliaresService
			.getDatosAuxiliares(id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.foto_url = response.data.foto_url || null;

					const nombre = response.data.nombre || "Nombre no disponible";
					this.asignacionForm.get("nombre")?.setValue(nombre);
					this.cdr.markForCheck();
				},
				error: (error) => {
					const errorMessage =
						error.error?.error || "Error al cargar datos auxiliares";

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

			payload.activo_id = this.id || undefined;

			this.asignacionService
				.createAsignacion(payload)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (_response) => {
						this.cdr.markForCheck();
						Swal.fire({
							title: "¡Éxito!",
							text: "Asignación creada correctamente.",
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
							error.error?.error || "Error al crear la asignación";

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
