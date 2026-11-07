import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
	signal,
} from "@angular/core";
import {
	AbstractControl,
	FormBuilder,
	FormGroup,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { CatalogosFacade } from "../../core/catalogos/catalogos.facade";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { ActivoPayload, GarantiaItem } from "../../models/activo.interface";
import { SelectItem } from "../../models/datos-auxiliares.interface";
import { ActivosMutacionesFacade } from "../application/activos-mutaciones.facade";
import { ActivoService } from "../service/activo.service";

const EMPTY_ITEMS: SelectItem[] = [];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-editar-activo",
	standalone: false,
	templateUrl: "./editar-activo.component.html",
	styleUrl: "./editar-activo.component.css",
})
export class EditarActivoComponent implements OnInit, OnDestroy {
	// Formulario para editar un activo
	editarActivoForm!: FormGroup;
	activoId!: number; // ID del activo
	errorMessage: string = "";

	get tiposActivos(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.tipos ?? EMPTY_ITEMS;
	}

	get proveedores(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.proveedores ?? EMPTY_ITEMS;
	}

	get ubicaciones(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.ubicaciones ?? EMPTY_ITEMS;
	}

	get proveedorGarantia(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.proveedoresGarantia ?? EMPTY_ITEMS;
	}

	get duenos(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.duenos ?? EMPTY_ITEMS;
	}

	get estados(): SelectItem[] {
		return this.catalogosFacade.catalogos()?.estados ?? EMPTY_ITEMS;
	}

	public previewUrl = signal<string | null>(null); // Vista previa de la nueva imagen
	imagenActual: string | null | undefined = null; // URL de la imagen actual del activo
	imagenOriginal: string | null | undefined = null; // Guardar la imagen inicial del backend
	imagenLocalStorageKey: string | null = null; // Clave de la imagen en localStorage
	isUploading = signal(false);
	private destroy$ = new Subject<void>();

	get haCambiadoImagen(): boolean {
		// Ha cambiado si hay un preview nuevo O si la imagen actual es nula pero la original no lo era (borrado)
		return (
			!!this.previewUrl() ||
			(this.imagenActual === null && this.imagenOriginal !== null)
		);
	}

	condicionesFisicas = [
		{ id: 1, nombre: "Nuevo" },
		{ id: 2, nombre: "Usado" },
		{ id: 3, nombre: "Dañado" },
	];

	estadoGarantia = [
		{ id: 1, nombre: "Vigente" },
		{ id: 2, nombre: "Por vencer" },
		{ id: 3, nombre: "Vencida" },
	];

	constructor(
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
		private activoService: ActivoService,
		private mutaciones: ActivosMutacionesFacade,
		private catalogosFacade: CatalogosFacade,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.activoId = +(this.route.snapshot.paramMap.get("id") || 0);
		this.inicializarFormulario();
		this.cargarDatosActivo();
	}

	// Inicializar el formulario
	inicializarFormulario(): void {
		this.editarActivoForm = this.fb.group({
			nombre: ["", Validators.required],
			tipo_id: ["", Validators.required],
			fecha_adquisicion: ["", Validators.required],
			valor_compra: [null, [Validators.required, Validators.min(0)]],
			estado: ["", Validators.required],
			proveedor_id: ["", Validators.required],
			ubicacion_id: ["", Validators.required],
			dueno_id: ["", Validators.required],
			modelo: [""],
			version_software: [""],
			tipo_licencia: [""],
			fecha_vencimiento_licencia: [""],
			costo_mensual: [null, Validators.min(0)],
			recursos_asignados: [""],
			condicion_fisica: ["", this.condicionFisicaValidator()],
			etiqueta_serial: [""],
			descripcion: [""],
			nombre_garantia: [""],
			proveedor_garantia_id: [""],
			fecha_inicio: [""],
			fecha_fin: [""],
			estado_garantia: [""],
			descripcion_garantia: [""],
			costo: [null],
			condiciones: [""],
		});
	}

	// Quitar imagen completamente (enviará null al backend al guardar)
	removeImage(): void {
		Swal.fire({
			title: "¿Eliminar Imagen?",
			text: "Esta acción marcará la imagen para ser eliminada permanentemente al guardar los cambios.",
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
				// Eliminar imagen del localStorage si existe
				if (this.imagenLocalStorageKey) {
					localStorage.removeItem(this.imagenLocalStorageKey);
					this.imagenLocalStorageKey = null;
				}

				// Limpiar vista previa
				this.previewUrl.set(null);
				this.imagenActual = null; // Marcar como nula para el backend
			}
		});
	}

	// Restaurar la imagen original del backend
	restoreOriginalImage(): void {
		// Eliminar imagen nueva del localStorage si existe
		if (this.imagenLocalStorageKey) {
			localStorage.removeItem(this.imagenLocalStorageKey);
			this.imagenLocalStorageKey = null;
		}

		// Limpiar vista previa y volver a la original
		this.previewUrl.set(null);
		this.imagenActual = this.imagenOriginal;
	}

	// Cargar datos del activo a editar
	cargarDatosActivo(): void {
		this.activoService
			.getActivoById(this.activoId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					// Guarda la imagen actual y la original para comparaciones
					this.imagenActual = response.data.foto_url || null;
					this.imagenOriginal = response.data.foto_url || null;

					// Si hay imagen actual, prepara la vista previa (esto es opcional ahora que usamos haCambiadoImagen)
					this.previewUrl.set(null);

					// Manejo SEGURO de garantía (si es null o undefined)
					const garantia: GarantiaItem =
						response.data.garantia?.[0] ?? ({} as GarantiaItem); // Si no hay garantía, usa objeto vacío
					const datosFormulario = {
						nombre: response.data.nombre || undefined,
						dueno_id: response.data.dueno?.id || undefined,
						tipo_id: response.data.tipo?.id || undefined,
						fecha_adquisicion: response.data.fecha_adquisicion
							? response.data.fecha_adquisicion.split("T")[0]
							: undefined,
						valor_compra: response.data.valor_compra,
						proveedor_id: response.data.proveedor?.id || undefined,
						modelo: response.data.modelo || undefined,
						version_software: response.data.version_software || undefined,
						tipo_licencia: response.data.tipo_licencia || undefined,
						condicion_fisica: response.data.condicion_fisica || undefined,
						etiqueta_serial: response.data.etiqueta_serial || undefined,
						descripcion: response.data.descripcion || undefined,
						estado: response.data.estado || undefined,
						ubicacion_id: response.data.ubicacion?.id || undefined,
						fecha_vencimiento_licencia: response.data.fecha_vencimiento_licencia
							? response.data.fecha_vencimiento_licencia.split("T")[0]
							: undefined,
						costo_mensual: response.data.costo_mensual || undefined,
						recursos_asignados: response.data.recursos_asignados || undefined,
						nombre_garantia: garantia.nombre_garantia || undefined,
						proveedor_garantia_id: garantia.proveedor?.id || undefined,
						fecha_inicio: garantia.fecha_inicio
							? garantia.fecha_inicio.split("T")[0]
							: undefined,
						fecha_fin: garantia.fecha_fin
							? garantia.fecha_fin.split("T")[0]
							: undefined,
						estado_garantia: garantia.estado_garantia || undefined,
						descripcion_garantia: garantia.descripcion || undefined,
						costo: garantia.costo || undefined,
						condiciones: garantia.condiciones || undefined,
					};

					this.editarActivoForm.patchValue(datosFormulario);
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener activo" }
					const errorMessage = error.error?.error || "Error al obtener activo";

					// Mostrar el mensaje
					this.errorMessage = errorMessage;
					console.error("Error del backend:", errorMessage);
					Swal.fire({
						icon: "error",
						text: errorMessage,
						confirmButtonColor: "#1e293b",
					});
				},
			});
	}
	// Manejar la selección de archivos (imagen)
	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file?.type.startsWith("image/")) {
			// Vista previa local
			const reader = new FileReader();
			reader.onload = () => {
				this.previewUrl.set(reader.result as string);
				// Guardar en localStorage (clave única para evitar conflictos)
				const imageKey = `activo_img_${Date.now()}`;
				const preview = this.previewUrl();
				if (preview) localStorage.setItem(imageKey, preview);
				this.imagenLocalStorageKey = imageKey; // Guardar la clave para usarla después
			};
			reader.readAsDataURL(file);
		} else {
			Swal.fire({
				icon: "error",
				text: "Por favor selecciona una imagen válida (JPEG, PNG, GIF).",
				confirmButtonColor: "#1e293b",
			});
		}
	}
	// Manejar el envío del formulario
	async onSubmit(): Promise<void> {
		if (!this.editarActivoForm.valid) {
			this.editarActivoForm.markAllAsTouched();
			return;
		}

		const formData = new FormData();
		const fv = this.editarActivoForm.value as ActivoPayload;

		for (const key of Object.keys(fv) as (keyof ActivoPayload)[]) {
			const val = fv[key];
			if (val !== null && val !== undefined && val !== "") {
				formData.append(key, String(val));
			}
		}

		if (this.imagenLocalStorageKey) {
			const imageDataUrl = localStorage.getItem(this.imagenLocalStorageKey);
			if (imageDataUrl) {
				const blob = this.dataURLtoBlob(imageDataUrl);
				formData.append("file", blob, "activo.jpg");
			}
		} else if (this.imagenActual) {
			formData.append("foto_url", this.imagenActual);
		} else if (this.imagenActual === null) {
			formData.append("foto_url", "");
		}

		this.isUploading.set(true);
		Swal.fire({
			title: "Actualizando activo...",
			allowOutsideClick: false,
			didOpen: () => Swal.showLoading(),
		});

		try {
			await this.mutaciones.editar(this.activoId, formData);
			Swal.close();

			if (this.imagenLocalStorageKey) {
				localStorage.removeItem(this.imagenLocalStorageKey);
				this.imagenLocalStorageKey = null;
			}

			await Swal.fire({
				title: "¡Actualizado!",
				text: "Los cambios se han guardado exitosamente.",
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
			Swal.close();
			const errorMessage = getHttpErrorMessage(
				error,
				"Error al actualizar el activo",
			);
			this.errorMessage = errorMessage;
			Swal.fire({
				title: "Error de guardado",
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
		} finally {
			this.isUploading.set(false);
		}
	}

	/**
	 * Convierte DataURL a Blob (para enviar la imagen al backend).
	 */
	private dataURLtoBlob(dataURL: string): Blob {
		const arr = dataURL.split(",");
		const mime = arr[0].match(/:(.*?);/)?.[1] || "";
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);

		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], { type: mime });
	}

	// Manejar el evento de cancelar
	onCancelar(): void {
		Swal.fire({
			title: "¿Descartar Cambios?",
			text: "Tienes cambios sin guardar. Si continúas, se perderá toda la información editada.",
			icon: "question",
			showCancelButton: true,
			confirmButtonText: "Sí, descartar",
			cancelButtonText: "Seguir editando",
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
				this.editarActivoForm.reset();
				if (this.imagenLocalStorageKey) {
					localStorage.removeItem(this.imagenLocalStorageKey);
					this.imagenLocalStorageKey = null;
					this.previewUrl.set(null);
				}
				this.router.navigate(["/gestion-activos"]);
			}
		});
	}

	// Validador personalizado para condicionFisica
	condicionFisicaValidator(): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			const valor = control.value;
			if (!valor) return null;
			if (!["Nuevo", "Usado", "Dañado"].includes(valor)) {
				return { condicionInvalida: true };
			}
			return null;
		};
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
