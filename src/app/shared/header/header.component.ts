import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	HostListener,
	OnDestroy,
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "../../../environments/environment";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { AuthService } from "../../login/services/auth.service";
import type { UserData } from "../../models/auth.interface";
import {
	AlertaItem,
	NotificationService,
} from "../services/notification.service";
import { type Theme, ThemeService } from "../services/theme.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-header",
	standalone: true,
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.css",
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HeaderComponent implements OnDestroy {
	apiUrl = environment.apiUrl;

	private destroy$ = new Subject<void>();
	usuario: UserData | null = null;
	showNotifications = false;
	showProfileMenu = false;
	menuTemaAbierto = false;
	menuIdiomaAbierto = false;
	alertasList: AlertaItem[] = [];
	totalAlertas = 0;

	themeService: ThemeService;

	constructor(
		private router: Router,
		private authService: AuthService,
		private notificationService: NotificationService,
		private themeSvc: ThemeService,
		private cdr: ChangeDetectorRef,
	) {
		this.themeService = themeSvc;
		this.usuario = this.authService.getUserData();

		this.authService.user$
			.pipe(takeUntil(this.destroy$))
			.subscribe((usuario) => {
				this.usuario = usuario;
				this.cdr.markForCheck();
			});
		this.authService
			.onLogout()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {});

		if (this.authService.isLoggedIn() && !this.authService.isEmpleado()) {
			this.notificationService.load();
		}

		this.notificationService.alertasList$
			.pipe(takeUntil(this.destroy$))
			.subscribe((list) => {
				this.alertasList = list;
			});

		this.notificationService.totalAlerts$
			.pipe(takeUntil(this.destroy$))
			.subscribe((total) => {
				this.totalAlertas = total;
			});
	}

	@HostListener("document:click", ["$event"])
	onDocumentClick(event: Event): void {
		const target = event.target as HTMLElement;
		if (this.showNotifications && !target.closest(".notification-wrapper")) {
			this.showNotifications = false;
		}
		if (this.showProfileMenu && !target.closest(".profile-wrapper")) {
			this.cerrarMenuPerfil();
		}
	}

	isLoginRoute(): boolean {
		return this.router.url === "/login";
	}

	isLoggedIn(): boolean {
		return this.authService.isLoggedIn();
	}

	isEmpleado(): boolean {
		return this.authService.isEmpleado();
	}

	getUserPhoto(): string {
		const fotoUrl = this.usuario?.foto_url || "";

		return fotoUrl || "https://assets.liuma.app/nemi/img-perfil.jpg";
	}

	toggleNotifications(): void {
		this.showNotifications = !this.showNotifications;
	}

	navigateTo(filtro: string): void {
		this.showNotifications = false;

		if (filtro === "licencia_proxima") {
			this.router.navigate(["/gestion-activos"], {
				queryParams: { licencia_proxima: "true" },
			});
		} else if (filtro === "garantia_proxima") {
			this.router.navigate(["/gestion-activos"], {
				queryParams: { garantia_proxima: "true" },
			});
		} else if (filtro === "estado") {
			this.router.navigate(["/gestion-activos"], {
				queryParams: { estado: "mantenimiento" },
			});
		} else if (filtro === "fecha_devolucion_proxima") {
			this.router.navigate(["/gestion-activos"], {
				queryParams: { fecha_devolucion_proxima: "true" },
			});
		} else if (filtro === "incidencia") {
			this.router.navigate(["/incidencias"]);
		} else if (filtro === "mantenimiento") {
			this.router.navigate(["/mantenimientos"]);
		} else if (filtro === "solicitud") {
			this.router.navigate(["/solicitudes"]);
		}
	}

	toggleProfileMenu(): void {
		this.showProfileMenu = !this.showProfileMenu;
		this.menuTemaAbierto = false;
		this.menuIdiomaAbierto = false;
	}

	cerrarMenuPerfil(): void {
		this.showProfileMenu = false;
		this.menuTemaAbierto = false;
		this.menuIdiomaAbierto = false;
	}

	toggleSubmenu(menu: "tema" | "idioma"): void {
		if (menu === "tema") {
			this.menuTemaAbierto = !this.menuTemaAbierto;
			this.menuIdiomaAbierto = false;
		} else {
			this.menuIdiomaAbierto = !this.menuIdiomaAbierto;
			this.menuTemaAbierto = false;
		}
	}

	get temaActualLabel(): string {
		const tema = this.themeService.theme();
		if (tema === "dark") return "Oscuro";
		if (tema === "light") return "Claro";
		return "Sistema";
	}

	cambiarTema(theme: Theme): void {
		this.themeService.setTheme(theme);
		this.menuTemaAbierto = false;
	}

	irATab(tab: string): void {
		this.cerrarMenuPerfil();
		this.router.navigate(["/configuracion"], { queryParams: { tab } });
	}

	irAPerfil(): void {
		this.irATab("perfil");
	}

	irAConfiguracion(): void {
		this.irATab(this.authService.isAdmin() ? "localizacion" : "perfil");
	}

	cerrarSesionEnTodos(): void {
		this.cerrarMenuPerfil();
		Swal.fire({
			title: "¿Cerrar sesión en todos?",
			text: "Se cerrarán todas las sesiones activas de tu cuenta.",
			icon: "question",
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
		}).then((result) => {
			if (!result.isConfirmed) return;

			this.authService.logoutAll().subscribe({
				next: () =>
					this.authService.logout("Cerraste sesión en todos los dispositivos."),
				error: (error) => {
					Swal.fire({
						title: "Error",
						text: getHttpErrorMessage(
							error,
							"No se pudieron cerrar las sesiones.",
						),
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
		});
	}

	cerrarSesion(): void {
		this.cerrarMenuPerfil();
		Swal.fire({
			title: "¿Cerrar sesión?",
			text: "¿Estás seguro de que deseas salir del sistema?",
			icon: "question",
			showCancelButton: true,
			confirmButtonText: "Sí, salir",
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
			if (result.isConfirmed) this.authService.logout();
		});
	}

	getUserName(): string {
		return this.usuario?.nombre || "Mi cuenta";
	}

	getUserRole(): string {
		return this.usuario?.rol || "Usuario";
	}

	getUserEmail(): string {
		return this.usuario?.email || "";
	}

	irAlDashboard(): void {
		this.showNotifications = false;
		this.router.navigate(["/dashboard"]);
	}

	toggleTheme(): void {
		this.themeSvc.toggle();
	}

	get themeIcon(): string {
		return this.themeSvc.isDark() ? "ph:sun" : "ph:moon";
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	getTitle(): string {
		const currentRoute = this.router.url.split("?")[0];

		if (currentRoute.startsWith("/gestion-activos/agregar"))
			return "Nuevo activo";
		if (currentRoute.startsWith("/gestion-activos/editar"))
			return "Editar activo";
		if (currentRoute.startsWith("/gestion-activos/"))
			return "Detalle de activo";
		if (currentRoute.startsWith("/gestion-activos")) return "Activos";
		if (currentRoute.startsWith("/licencias")) return "Licencias";
		if (currentRoute.startsWith("/mantenimientos")) return "Mantenimientos";
		if (currentRoute.startsWith("/incidencias")) return "Incidencias";
		if (currentRoute.startsWith("/solicitudes")) return "Solicitudes";
		if (currentRoute.startsWith("/asignaciones")) return "Asignaciones";
		if (currentRoute.startsWith("/usuarios")) return "Usuarios";
		if (currentRoute.startsWith("/reportes")) return "Reportes";
		if (currentRoute.startsWith("/configuracion")) return "Configuración";
		if (currentRoute.startsWith("/dashboard")) return "Dashboard";

		return "Nemi";
	}
}
