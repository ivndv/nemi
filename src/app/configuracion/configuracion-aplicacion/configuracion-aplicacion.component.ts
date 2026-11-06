import { HttpClient } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
} from "@angular/core";
import {
	AbstractControl,
	FormBuilder,
	type FormGroup,
	ValidationErrors,
	Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "../../../environments/environment";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";
import { AuthService } from "../../login/services/auth.service";
import { type Theme, ThemeService } from "../../shared/services/theme.service";
import { getCloudflareImage } from "../../utils/images";
import {
	type CambioContrasenaPayload,
	ConfiguracionService,
	type PerfilPayload,
} from "../services/configuracion.service";

type TabId =
	| "perfil"
	| "apariencia"
	| "idioma"
	| "seguridad"
	| "localizacion"
	| "alertas"
	| "sistema";

interface TabDef {
	id: TabId;
	label: string;
	description: string;
	icon: string;
	adminOnly?: boolean;
}

const TABS: TabDef[] = [
	{
		id: "perfil",
		label: "Perfil",
		description: "Tus datos personales.",
		icon: "ph:user-circle",
	},
	{
		id: "apariencia",
		label: "Apariencia",
		description: "Tema de la interfaz.",
		icon: "ph:palette",
	},
	{
		id: "idioma",
		label: "Idioma",
		description: "Preferencia de idioma.",
		icon: "ph:translate",
	},
	{
		id: "seguridad",
		label: "Seguridad",
		description: "Contraseña de la cuenta.",
		icon: "ph:lock-simple",
	},
	{
		id: "localizacion",
		label: "Localización",
		description: "Zona horaria y formatos.",
		icon: "ph:globe-hemisphere-west",
		adminOnly: true,
	},
	{
		id: "alertas",
		label: "Alertas",
		description: "Umbrales de aviso.",
		icon: "ph:bell-ringing",
		adminOnly: true,
	},
	{
		id: "sistema",
		label: "Sistema",
		description: "Estado del entorno.",
		icon: "ph:desktop-tower",
		adminOnly: true,
	},
];

const THEME_OPTIONS: {
	value: Theme;
	label: string;
	description: string;
}[] = [
	{
		value: "light",
		label: "Claro",
		description: "Fondo claro y texto oscuro.",
	},
	{
		value: "dark",
		label: "Oscuro",
		description: "Fondo oscuro y texto claro.",
	},
	{
		value: "system",
		label: "Sistema",
		description: "Sigue el tema del dispositivo.",
	},
];

function contrasenasCoinciden(group: AbstractControl): ValidationErrors | null {
	const nueva = group.get("nueva_contrasena")?.value;
	const confirmar = group.get("confirmar_nueva_contrasena")?.value;

	if (!nueva && !confirmar) return null;
	return nueva === confirmar ? null : { noCoinciden: true };
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-configuracion-aplicacion",
	standalone: false,
	templateUrl: "./configuracion-aplicacion.component.html",
	styleUrl: "./configuracion-aplicacion.component.css",
})
export class ConfiguracionAplicacionComponent implements OnInit, OnDestroy {
	readonly themeService = inject(ThemeService);
	private readonly preferencias = inject(PreferenciasService);
	readonly tabActiva = signal<TabId>("perfil");
	readonly guardandoPerfil = signal(false);
	readonly guardandoPassword = signal(false);
	readonly guardandoConfig = signal(false);
	readonly guardandoAlertas = signal(false);
	readonly subiendoFoto = signal(false);
	readonly previewUrl = signal<string | null>(null);
	readonly apiEstado = signal<"checking" | "ok" | "error">("checking");

	readonly themeOptions = THEME_OPTIONS;
	readonly entorno = environment.production ? "Producción" : "Desarrollo";
	readonly apiUrl = environment.apiUrl;

	readonly zonasHorarias = [
		{ codigo: "America/Mexico_City", nombre: "Ciudad de México · GMT-6" },
		{ codigo: "America/Monterrey", nombre: "Monterrey · GMT-6" },
		{ codigo: "America/Bogota", nombre: "Bogotá · GMT-5" },
		{ codigo: "America/Lima", nombre: "Lima · GMT-5" },
		{ codigo: "America/Santiago", nombre: "Santiago · GMT-3/-4" },
		{
			codigo: "America/Argentina/Buenos_Aires",
			nombre: "Buenos Aires · GMT-3",
		},
		{ codigo: "America/New_York", nombre: "Nueva York · GMT-5/-4" },
		{ codigo: "America/Los_Angeles", nombre: "Los Ángeles · GMT-8/-7" },
		{ codigo: "Europe/Madrid", nombre: "Madrid · GMT+1/+2" },
		{ codigo: "Europe/London", nombre: "Londres · GMT+0/+1" },
		{ codigo: "UTC", nombre: "UTC" },
	];

	readonly formatosFecha = [
		{ codigo: "DD/MM/YYYY", nombre: "DD/MM/YYYY" },
		{ codigo: "MM/DD/YYYY", nombre: "MM/DD/YYYY" },
		{ codigo: "YYYY-MM-DD", nombre: "YYYY-MM-DD" },
	];

	readonly monedas = [
		{ codigo: "MXN", nombre: "Peso mexicano (MXN)" },
		{ codigo: "USD", nombre: "Dólar estadounidense (USD)" },
		{ codigo: "EUR", nombre: "Euro (EUR)" },
	];

	readonly perfilForm: FormGroup;
	readonly passwordForm: FormGroup;
	readonly localizacionForm: FormGroup;
	readonly alertasForm: FormGroup;

	rolPerfil = "";
	fechaIngreso = "";

	private imagenActual = "";
	private fotoUrlSubida: string | null = null;
	private readonly destroy$ = new Subject<void>();

	constructor(
		private cdr: ChangeDetectorRef,
		private fb: FormBuilder,
		private configuracionService: ConfiguracionService,
		private authService: AuthService,
		private route: ActivatedRoute,
		private router: Router,
		private http: HttpClient,
	) {
		this.perfilForm = this.fb.nonNullable.group({
			nombre: ["", Validators.required],
			email: ["", [Validators.required, Validators.email]],
			departamento: [""],
		});

		this.passwordForm = this.fb.nonNullable.group(
			{
				contrasena_actual: ["", Validators.required],
				nueva_contrasena: ["", [Validators.required, Validators.minLength(8)]],
				confirmar_nueva_contrasena: ["", Validators.required],
			},
			{ validators: contrasenasCoinciden },
		);

		this.localizacionForm = this.fb.nonNullable.group({
			zona_horaria: ["", Validators.required],
			formato_fecha: ["", Validators.required],
			formato_moneda: ["", Validators.required],
		});

		this.alertasForm = this.fb.nonNullable.group({
			dias_alerta_licencia: [30, [Validators.required, Validators.min(1)]],
			dias_alerta_garantia: [30, [Validators.required, Validators.min(1)]],
			dias_alerta_devolucion: [7, [Validators.required, Validators.min(1)]],
			dias_alerta_mantenimiento: [3, [Validators.required, Validators.min(1)]],
		});
	}

	ngOnInit(): void {
		this.cargarPerfil();

		if (this.esAdmin()) {
			this.cargarConfiguracion();
			this.comprobarApi();
		}

		this.route.queryParamMap
			.pipe(takeUntil(this.destroy$))
			.subscribe((params) => {
				const tab = params.get("tab") as TabId | null;
				if (tab && this.tabsVisibles().some((item) => item.id === tab)) {
					this.tabActiva.set(tab);
				}
			});
	}

	esAdmin(): boolean {
		return this.authService.isAdmin();
	}

	tabsVisibles(): TabDef[] {
		return TABS.filter((tab) => !tab.adminOnly || this.esAdmin());
	}

	seleccionarTab(tab: TabId): void {
		this.tabActiva.set(tab);
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { tab },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	cambiarTema(theme: Theme): void {
		this.themeService.setTheme(theme);
	}

	// ---------------------------------------------------------------
	// Perfil
	// ---------------------------------------------------------------
	private cargarPerfil(): void {
		this.configuracionService
			.getPerfilUsuario()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					const perfil = response.data;
					this.rolPerfil = perfil.rol ?? "";
					this.fechaIngreso = perfil.fecha_ingreso
						? this.formatearFecha(perfil.fecha_ingreso)
						: "—";

					this.perfilForm.patchValue({
						nombre: perfil.nombre ?? "",
						email: perfil.email ?? "",
						departamento: perfil.departamento ?? "",
					});

					this.imagenActual = perfil.foto_url ?? "";
					this.previewUrl.set(this.resolverFoto(this.imagenActual));

					this.authService.updateStoredUser({
						nombre: perfil.nombre,
						email: perfil.email,
						departamento: perfil.departamento,
						foto_url: this.imagenActual,
					});

					this.cdr.markForCheck();
				},
				error: (error) => this.avisarError(error, "Error al cargar el perfil"),
			});
	}

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			this.avisar("Formato no válido", "Usa una imagen JPG, PNG o WebP.");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			this.avisar("Imagen muy grande", "El máximo permitido es 5 MB.");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => this.previewUrl.set(reader.result as string);
		reader.readAsDataURL(file);

		const formData = new FormData();
		formData.append("file", file);

		this.subiendoFoto.set(true);
		this.configuracionService
			.subirImagen(formData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.subiendoFoto.set(false);
					this.fotoUrlSubida = response.data.url;
					this.avisar(
						"Foto lista",
						"Guarda los cambios para aplicarla a tu perfil.",
					);
					this.cdr.markForCheck();
				},
				error: (error) => {
					this.subiendoFoto.set(false);
					this.previewUrl.set(this.resolverFoto(this.imagenActual));
					this.avisarError(error, "No se pudo subir la imagen");
					this.cdr.markForCheck();
				},
			});
	}

	guardarPerfil(): void {
		if (this.perfilForm.invalid) {
			this.perfilForm.markAllAsTouched();
			return;
		}

		const { nombre, email, departamento } = this.perfilForm.getRawValue();
		const payload: PerfilPayload = { nombre, email };
		const nuevaFoto = this.fotoUrlSubida;

		if (departamento?.trim()) payload.departamento = departamento.trim();
		if (nuevaFoto) payload.foto_url = nuevaFoto;

		this.guardandoPerfil.set(true);
		this.configuracionService
			.updatePerfilUsuario(payload)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.guardandoPerfil.set(false);
					if (nuevaFoto) {
						this.imagenActual = nuevaFoto;
						this.fotoUrlSubida = null;
					}
					const cambiosSesion: Record<string, string> = { nombre, email };
					if (payload.departamento)
						cambiosSesion["departamento"] = payload.departamento;
					if (nuevaFoto) cambiosSesion["foto_url"] = nuevaFoto;

					this.authService.updateStoredUser(cambiosSesion);
					this.avisar("Perfil actualizado", "Tus datos se guardaron.");
					this.cdr.markForCheck();
				},
				error: (error) => {
					this.guardandoPerfil.set(false);
					this.avisarError(error, "Error al actualizar el perfil");
				},
			});
	}

	restaurarPerfil(): void {
		this.fotoUrlSubida = null;
		this.previewUrl.set(this.resolverFoto(this.imagenActual));
		this.cargarPerfil();
	}

	// ---------------------------------------------------------------
	// Seguridad
	// ---------------------------------------------------------------
	guardarPassword(): void {
		if (this.passwordForm.invalid) {
			this.passwordForm.markAllAsTouched();
			return;
		}

		const payload = this.passwordForm.getRawValue() as CambioContrasenaPayload;

		this.guardandoPassword.set(true);
		this.configuracionService
			.cambiarContrasena(payload)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.guardandoPassword.set(false);
					this.passwordForm.reset();
					this.avisar(
						"Contraseña actualizada",
						"Usa la nueva en tu próximo acceso.",
					);
					this.cdr.markForCheck();
				},
				error: (error) => {
					this.guardandoPassword.set(false);
					this.avisarError(error, "Error al cambiar la contraseña");
				},
			});
	}

	cerrarTodasLasSesiones(): void {
		Swal.fire({
			title: "¿Cerrar todas las sesiones?",
			text: "Se cerrará la sesión en todos los dispositivos, incluida esta.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sí, cerrar todas",
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
		}).then((resultado) => {
			if (!resultado.isConfirmed) return;

			this.authService.logoutAll().subscribe({
				next: () =>
					this.authService.logout("Cerraste sesión en todos los dispositivos."),
				error: (error) =>
					this.avisarError(error, "No se pudieron cerrar las sesiones"),
			});
		});
	}

	// ---------------------------------------------------------------
	// Configuración del sistema
	// ---------------------------------------------------------------
	private cargarConfiguracion(): void {
		this.configuracionService
			.getConfiguracionAplicacion()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					const data = response.data;
					this.localizacionForm.patchValue({
						zona_horaria: data.zona_horaria ?? "",
						formato_fecha: data.formato_fecha ?? "",
						formato_moneda: data.formato_moneda ?? data.moneda ?? "",
					});
					this.alertasForm.patchValue({
						dias_alerta_licencia: data.dias_alerta_licencia ?? 30,
						dias_alerta_garantia: data.dias_alerta_garantia ?? 30,
						dias_alerta_devolucion: data.dias_alerta_devolucion ?? 7,
						dias_alerta_mantenimiento: data.dias_alerta_mantenimiento ?? 3,
					});
					this.cdr.markForCheck();
				},
				error: (error) =>
					this.avisarError(error, "Error al cargar la configuración"),
			});
	}

	guardarLocalizacion(): void {
		if (this.localizacionForm.invalid) {
			this.localizacionForm.markAllAsTouched();
			return;
		}

		const valores = this.localizacionForm.getRawValue();

		this.guardandoConfig.set(true);
		this.configuracionService
			.updateConfiguracionAplicacion(valores)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.guardandoConfig.set(false);
					this.preferencias.setZonaHoraria(valores.zona_horaria);
					this.avisar("Configuración guardada", "Se aplicaron los cambios.");
					this.cdr.markForCheck();
				},
				error: (error) => {
					this.guardandoConfig.set(false);
					this.avisarError(error, "Error al guardar la configuración");
				},
			});
	}

	guardarAlertas(): void {
		if (this.alertasForm.invalid) {
			this.alertasForm.markAllAsTouched();
			return;
		}

		this.guardandoAlertas.set(true);
		this.configuracionService
			.updateConfiguracionAplicacion(this.alertasForm.getRawValue())
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.guardandoAlertas.set(false);
					this.avisar("Alertas actualizadas", "Los umbrales se guardaron.");
					this.cdr.markForCheck();
				},
				error: (error) => {
					this.guardandoAlertas.set(false);
					this.avisarError(error, "Error al guardar las alertas");
				},
			});
	}

	comprobarApi(): void {
		this.apiEstado.set("checking");
		this.http
			.get<{ data: { status: string; db: string } }>(
				`${environment.apiUrl}/health`,
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.apiEstado.set(response.data?.status === "ok" ? "ok" : "error");
					this.cdr.markForCheck();
				},
				error: () => {
					this.apiEstado.set("error");
					this.cdr.markForCheck();
				},
			});
	}

	// ---------------------------------------------------------------
	// Utilidades
	// ---------------------------------------------------------------
	private resolverFoto(foto: string): string | null {
		if (!foto) return null;
		return (
			getCloudflareImage(foto, { width: 160 }) ||
			"https://assets.liuma.app/nemi/img-perfil.jpg"
		);
	}

	private formatearFecha(fecha: string): string {
		const [year, month, day] = fecha.slice(0, 10).split("-").map(Number);

		if (!year || !month || !day) return fecha;

		return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	}

	private avisar(title: string, text?: string): void {
		Swal.fire({
			title,
			text,
			icon: "success",
			timer: 2000,
			showConfirmButton: false,
			customClass: {
				popup: "premium-swal-popup",
				title: "premium-swal-title",
				htmlContainer: "premium-swal-html",
			},
		});
	}

	private avisarError(error: unknown, fallback: string): void {
		Swal.fire({
			title: "Error",
			text: getHttpErrorMessage(error, fallback),
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

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
