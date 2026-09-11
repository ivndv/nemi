import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	HostListener,
	OnDestroy,
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../login/services/auth.service";
import { getCloudflareImage } from "../../utils/images";
import {
	AlertaItem,
	NotificationService,
} from "../services/notification.service";
import { ThemeService } from "../services/theme.service";

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
	fotoUrl: string = "";
	showNotifications = false;
	alertasList: AlertaItem[] = [];
	totalAlertas = 0;

	themeService: ThemeService;

	constructor(
		private router: Router,
		private authService: AuthService,
		private notificationService: NotificationService,
		private themeSvc: ThemeService,
	) {
		this.themeService = themeSvc;
		this.authService
			.onLogout()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {});

		if (this.authService.isLoggedIn()) {
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
	}

	isLoginRoute(): boolean {
		return this.router.url === "/login";
	}

	isLoggedIn(): boolean {
		return this.authService.isLoggedIn();
	}

	getUserPhoto(): string {
		const userData = this.authService.getUserData();
		const fotoUrl = userData?.foto_url || "";

		return (
			getCloudflareImage(fotoUrl, { width: 50 }) ||
			"https://assets.mgdc.site/nemi/img-perfil.jpg"
		);
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
				queryParams: { estado: "En mantenimiento" },
			});
		} else if (filtro === "fecha_devolucion_proxima") {
			this.router.navigate(["/gestion-activos"], {
				queryParams: { fecha_devolucion_proxima: "true" },
			});
		}
	}

	irAlDashboard(): void {
		this.showNotifications = false;
		this.router.navigate(["/dashboard"]);
	}

	toggleTheme(): void {
		this.themeSvc.toggle();
	}

	get themeIcon(): string {
		return this.themeSvc.current === "dark" ? "ph:sun" : "ph:moon";
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	getTitle(): string {
		const currentRoute = this.router.url;

		switch (currentRoute) {
			case "/login":
				return "Gestor de Activos";
			case "/dashboard":
				return "Dashboard";
			case "/gestion-activos":
				return "Gestión de Activos";
			case "/asignaciones":
				return "Asignaciones";
			case "/reportes":
				return "Reportes";
			case "/configuracion":
				return "Configuración";
			default:
				return "Gestor de Activos";
		}
	}
}
