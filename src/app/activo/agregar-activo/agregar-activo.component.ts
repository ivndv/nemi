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
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { ActivoPayload } from "../../models/activo.interface";
import { SelectItem } from "../../models/datos-auxiliares.interface";
import { ActivoService } from "../service/activo.service";
import { DatosService } from "../service/datos.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-agregar-activo",
	standalone: false,
	templateUrl: "./agregar-activo.component.html",
	styleUrl: "./agregar-activo.component.css",
})
export class AgregarActivoComponent implements OnInit, OnDestroy {
	agregarActivoForm!: FormGroup; // Formulario para agregar un activo
	serialError: string = ""; // Mensaje de error para la etiqueta serial
	errorMessage: string = ""; // Mensaje de error para el backend
	public previewUrl = signal<string | null>(null); // URL de la imagen seleccionada para previsualización
	imagenLocalStorageKey: string | null = null; // Clave de la imagen en localStorage
	imagenActual: string | null = null; // Imagen actual del activo (si existe)
	isUploading = signal(false);
	private destroy$ = new Subject<void>();
	tiposActivos: SelectItem[] = [];
	proveedores: SelectItem[] = [];
	ubicaciones: SelectItem[] = [];
	proveedorGarantia: SelectItem[] = [];
	duenos: SelectItem[] = [];
	estados: SelectItem[] = [];

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
		private datosService: DatosService,
		private activoService: ActivoService,
		private router: Router,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		// Inicializa el formulario con campos vacíos
		this.inicializarFormulario();

		// Carga los datos auxiliares necesarios para los selectores
		this.cargarDatosAuxiliares();
	}

	/**
	 * Inicializa el formulario reactivo con valores predeterminados.
	 */
	private inicializarFormulario(): void {
		this.agregarActivoForm = this.fb.group({
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

	/**
	 * Carga los datos auxiliares necesarios para los selectores.
	 */
	private cargarDatosAuxiliares(): void {
		this.datosService
			.obtenerDatosAuxiliares()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					// Asigna los datos recibidos a las propiedades correspondientes
					this.tiposActivos = response.data.tipos || [];
					this.proveedores = response.data.proveedores || [];
					this.ubicaciones = response.data.ubicaciones || [];
					this.proveedorGarantia = response.data.proveedoresGarantia || [];
					this.duenos = response.data.duenos || [];
					this.estados = response.data.estados || [];
					this.cdr.markForCheck();

					console.log("Datos auxiliares cargados:", response);
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { mensaje: "Error al obtener datos auxiliares" }
					const errorMessage =
						error.error?.mensaje || "Error al obtener datos auxiliares";

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
	// maneja el evento de selección de archivo
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
				if (this.previewUrl())
					localStorage.setItem(imageKey, this.previewUrl()!);
				this.imagenLocalStorageKey = imageKey; // Guardar la clave para usarla después
			};
			reader.readAsDataURL(file);
		} else {
			Swal.fire({
				title: "Imagen no válida",
				text: "Por favor selecciona una imagen válida (JPEG, PNG, GIF).",
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

	/**
	 * Envía los datos del formulario al backend para crear un nuevo activo.
	 */
	onSubmit(): void {
		if (!this.agregarActivoForm.valid) {
			this.agregarActivoForm.markAllAsTouched();
			return;
		}

		const formData = new FormData();
		const fv = this.agregarActivoForm.value as ActivoPayload;

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
		}

		this.isUploading.set(true);
		Swal.fire({
			title: "Creando activo...",
			allowOutsideClick: false,
			didOpen: () => Swal.showLoading(),
		});

		this.activoService
			.createActivo(formData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.isUploading.set(false);
					Swal.close();
					console.log("Activo creado con éxito:", response);
					if (this.imagenLocalStorageKey) {
						localStorage.removeItem(this.imagenLocalStorageKey);
					}
					this.cdr.markForCheck();
					Swal.fire({
						title: "¡Activo Creado!",
						text: "El activo ha sido registrado exitosamente.",
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
					this.isUploading.set(false);
					Swal.close();
					const errorMessage = error.error?.error || "Error al crear activo";
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

	// Quitar imagen completamente (enviará null al backend)
	removeImage(): void {
		// Eliminar imagen del localStorage si existe
		if (this.imagenLocalStorageKey) {
			localStorage.removeItem(this.imagenLocalStorageKey);
			this.imagenLocalStorageKey = null;
		}
		// Limpiar vista previa
		this.previewUrl.set(null);
	}

	/**
	 * Valida la etiqueta serial ingresada en el formulario.
	 * Si la etiqueta ya está registrada, muestra un mensaje de error.
	 */
	validarEtiquetaSerial(): void {
		const etiquetaSerial = this.agregarActivoForm.get("etiqueta_serial")?.value;

		if (etiquetaSerial) {
			this.datosService
				.validarEtiquetaSerial(etiquetaSerial)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response) => {
						// La etiqueta serial está disponible
						this.serialError = ""; // No hay error
						this.cdr.markForCheck();
						console.log("Respuesta del backend:", response);
					},
					error: (error) => {
						// Manejar errores devueltos por el backend
						const errorMessage = error.error?.error || "Error desconocido";
						this.serialError = errorMessage; // Mostrar mensaje de error
						console.error("Error al validar etiqueta serial:", errorMessage);
					},
				});
		} else {
			this.serialError = ""; // Limpiar el mensaje de error si el campo está vacío
		}
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

	/**
	 * Limpia el formulario y redirige a la vista de gestión de activos.
	 */
	onCancelar(): void {
		Swal.fire({
			title: "¿Cancelar?",
			text: "¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.",
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
				// Limpiar el formulario y localStorage
				this.agregarActivoForm.reset();

				if (this.imagenLocalStorageKey) {
					localStorage.removeItem(this.imagenLocalStorageKey);
					this.imagenLocalStorageKey = null;
					this.previewUrl.set(null);
				}
				this.router.navigate(["/gestion-activos"]);
			}
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
