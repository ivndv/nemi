import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
	signal,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { AuthService } from "../../login/services/auth.service";
import { getCloudflareImage } from "../../utils/images";
import { ConfiguracionService } from "../services/configuracion.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-configuracion-aplicacion",
	standalone: false,
	templateUrl: "./configuracion-aplicacion.component.html",
	styleUrl: "./configuracion-aplicacion.component.css",
})
export class ConfiguracionAplicacionComponent implements OnInit, OnDestroy {
	configuracionForm!: FormGroup;
	perfilForm!: FormGroup;
	errorMessage: string = "";

	public previewUrl = signal<string | null>(null); // Vista previa de la nueva imagen
	imagenActual: string | null = null; // URL de la imagen actual del activo
	imagenLocalStorageKey: string | null = null; // Clave de la imagen en localStorage
	isUploading = signal(false);
	private destroy$ = new Subject<void>();

	// Datos para NgSelect
	idiomasDisponibles = [
		{ codigo: "es", nombre: "Español" },
		{ codigo: "en", nombre: "Inglés" },
		{ codigo: "fr", nombre: "Francés" },
	];
	zonasHorariasDisponibles = [
		{ codigo: "UTC-5", nombre: "UTC-5" },
		{ codigo: "UTC+0", nombre: "UTC+0" },
		{ codigo: "UTC+3", nombre: "UTC+3" },
	];
	monedasDisponibles = [
		{ codigo: "USD", nombre: "Dólar estadounidense" },
		{ codigo: "EUR", nombre: "Euro" },
		{ codigo: "MXN", nombre: "Peso mexicano" },
	];

	formatosFechaDisponibles = [
		{ codigo: "DD/MM/YYYY", nombre: "DD/MM/YYYY" },
		{ codigo: "MM/DD/YYYY", nombre: "MM/DD/YYYY" },
		{ codigo: "YYYY-MM-DD", nombre: "YYYY-MM-DD" },
	];

	error: string | null = null;

	constructor(
		private cdr: ChangeDetectorRef,
		private fb: FormBuilder,
		private configuracionService: ConfiguracionService,
		private authService: AuthService,
	) {}

	ngOnInit(): void {
		this.inicializarFormularios();
		this.obtenerConfiguracion();
		this.obtenerPerfilUsuario();
	}

	/**
	 * Inicializa los formularios reactivos.
	 */
	inicializarFormularios(): void {
		this.configuracionForm = this.fb.group({
			idioma: ["", Validators.required],
			zona_horaria: ["", Validators.required],
			formato_fecha: ["", Validators.required],
			formato_moneda: ["", Validators.required],
		});

		this.perfilForm = this.fb.group(
			{
				nombre: [""],
				email: ["", Validators.email],
				departamento: [""],
				contrasena_actual: ["", Validators.required],
				nueva_contrasena: ["", Validators.minLength(8)],
				confirmar_nueva_contrasena: ["", Validators.minLength(8)],
				foto_url: [""],
			},
			{
				validators: this.confirmarContrasenas(
					"nueva_contrasena",
					"confirmar_nueva_contrasena",
				),
			},
		);
	}

	obtenerConfiguracion(): void {
		this.configuracionService
			.getConfiguracionAplicacion()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.configuracionForm.patchValue(response.data);
					this.cdr.markForCheck();
					console.log("Configuración cargada:", response);
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener la configuración." }
					const errorMessage =
						error.error?.error || "Error al obtener la configuración.";

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

	obtenerPerfilUsuario(): void {
		// Primero intentar obtener datos de la sesión local (AuthService)
		const localUserData = this.authService.getUserData();

		this.configuracionService
			.getPerfilUsuario()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					// Priorizar datos locales si existen, de lo contrario usar los del backend
					const nombre = localUserData?.nombre || response.data.nombre;
					const email = localUserData?.email || response.data.email;
					const departamento =
						localUserData?.departamento || response.data.departamento;
					const foto = localUserData?.foto_url || response.data.foto_url;

					this.imagenActual = foto || "";

					// Usar la lógica global robusta (150px para el perfil de configuración)
					this.previewUrl.set(
						getCloudflareImage(this.imagenActual, { width: 150 }) ||
							"https://assets.mgdc.site/nemi/img-perfil.jpg",
					);

					const perfilData = {
						nombre: nombre,
						email: email,
						departamento: departamento,
					};
					this.perfilForm.patchValue(perfilData);
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener la configuración." }
					const errorMessage =
						error.error?.error || "Error al obtener la configuración.";

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
				title: "Imagen Inválida",
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
	 * Validador personalizado para verificar que las contraseñas coincidan.
	 */
	confirmarContrasenas(contrasena: string, confirmarContrasena: string) {
		return (formGroup: FormGroup) => {
			const contrasenaControl = formGroup.get(contrasena);
			const confirmarControl = formGroup.get(confirmarContrasena);

			if (contrasenaControl?.value !== confirmarControl?.value) {
				confirmarControl?.setErrors({ noCoinciden: true });
			} else {
				confirmarControl?.setErrors(null);
			}
		};
	}

	/**
	 * Maneja la selección de un archivo para la foto de perfil.
	 */
	onFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			this.perfilForm.patchValue({ foto: file });
		}
	}

	guardarConfiguracion(): void {
		// 1. Primero verificar si el formulario es válido
		if (!this.perfilForm.valid) {
			Swal.fire({
				icon: "warning",
				text: "Por favor completa correctamente todos los campos requeridos",
				confirmButtonColor: "#1e293b",
			});
			this.perfilForm.markAllAsTouched(); // Marcar campos como tocados para mostrar errores
			return; // Detener la ejecución si el formulario no es válido
		}
		const configuracionData = {
			idioma: this.configuracionForm.value.idioma || undefined,
			zona_horaria: this.configuracionForm.value.zona_horaria || undefined,
			formato_fecha: this.configuracionForm.value.formato_fecha || undefined,
			formato_moneda: this.configuracionForm.value.formato_moneda || undefined,
		};
		// Filtrar para eliminar campos undefined (no enviarlos)
		const payload = Object.fromEntries(
			Object.entries(configuracionData).filter(([_, v]) => v !== undefined),
		);

		this.configuracionService
			.updateConfiguracionAplicacion(payload)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (_response) => {
					this.cdr.markForCheck();
					Swal.fire({
						title: "¡Configuración Guardada!",
						text: "Los ajustes del sistema se han actualizado correctamente.",
						icon: "success",
						timer: 2000,
						showConfirmButton: false,
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
						},
					});
					this.obtenerConfiguracion();
				},
				error: (error) => {
					const errorMessage =
						error.error?.error || "Error al guardar la configuración.";
					Swal.fire({
						title: "Error",
						text: errorMessage,
						icon: "error",
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
						},
					});
				},
			});
	}

	guardarPerfil(): void {
		if (!this.perfilForm.valid) {
			Swal.fire({
				title: "Formulario Incompleto",
				text: "Por favor completa correctamente todos los campos requeridos.",
				icon: "warning",
				buttonsStyling: false,
				customClass: {
					popup: "premium-swal-popup",
					title: "premium-swal-title",
					htmlContainer: "premium-swal-html",
					confirmButton: "premium-swal-confirm",
				},
			});
			this.perfilForm.markAllAsTouched();
			return;
		}

		const formData = new FormData();
		const fv = this.perfilForm.value;

		if (fv.nombre) formData.append("nombre", fv.nombre);
		if (fv.email) formData.append("email", fv.email);
		if (fv.departamento) formData.append("departamento", fv.departamento);
		if (fv.contrasena_actual)
			formData.append("contrasena_actual", fv.contrasena_actual);
		if (fv.nueva_contrasena)
			formData.append("nueva_contrasena", fv.nueva_contrasena);
		if (fv.confirmar_nueva_contrasena)
			formData.append(
				"confirmar_nueva_contrasena",
				fv.confirmar_nueva_contrasena,
			);

		if (this.imagenLocalStorageKey) {
			const imageDataUrl = localStorage.getItem(this.imagenLocalStorageKey);
			if (imageDataUrl) {
				const blob = this.dataURLtoBlob(imageDataUrl);
				formData.append("file", blob, "perfil.jpg");
			}
		} else if (this.imagenActual) {
			formData.append("foto_url", this.imagenActual);
		}

		this.isUploading.set(true);
		Swal.fire({
			title: "Actualizando perfil...",
			allowOutsideClick: false,
			didOpen: () => Swal.showLoading(),
		});

		this.configuracionService
			.updatePerfilUsuario(formData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.isUploading.set(false);
					this.cdr.markForCheck();
					Swal.close();
					console.log("Perfil actualizado:", response);
					if (this.imagenLocalStorageKey) {
						localStorage.removeItem(this.imagenLocalStorageKey);
						this.imagenLocalStorageKey = null;
					}
					Swal.fire({
						title: "¡Perfil Actualizado!",
						text: "Tu información se ha guardado correctamente.",
						icon: "success",
						timer: 2000,
						showConfirmButton: false,
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
						},
					});
					this.obtenerPerfilUsuario();
				},
				error: (error) => {
					this.isUploading.set(false);
					Swal.close();
					const errorMessage =
						error.error?.error || "Error al actualizar el perfil.";
					Swal.fire({
						title: "Error",
						text: errorMessage,
						icon: "error",
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
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

	cancelarConfiguracion(): void {
		Swal.fire({
			title: "¿Cancelar Cambios?",
			text: "Se perderán los ajustes del sistema no guardados.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sí, cancelar",
			cancelButtonText: "Continuar editando",
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
				this.configuracionForm.reset();
				this.obtenerConfiguracion();

				if (this.imagenLocalStorageKey) {
					localStorage.removeItem(this.imagenLocalStorageKey);
					this.imagenLocalStorageKey = null;
					this.previewUrl.set(null);
				}
			}
		});
	}

	cancelarPerfil(): void {
		Swal.fire({
			title: "¿Cancelar Cambios?",
			text: "Se perderán los datos del perfil no guardados.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sí, cancelar",
			cancelButtonText: "Continuar editando",
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
				this.perfilForm.reset();
				this.obtenerPerfilUsuario();

				if (this.imagenLocalStorageKey) {
					localStorage.removeItem(this.imagenLocalStorageKey);
					this.imagenLocalStorageKey = null;
					this.previewUrl.set(null);
				}
			}
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
