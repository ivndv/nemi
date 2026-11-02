import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Router } from "@angular/router";
import { injectQueryClient } from "@tanstack/angular-query-experimental";
import { AuthService } from "./login/services/auth.service";
import { ThemeService } from "./shared/services/theme.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-root",
	standalone: false,
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.css",
})
export class AppComponent {
	private readonly queryClient = injectQueryClient();

	constructor(
		private authService: AuthService,
		private router: Router,
		_themeService: ThemeService,
	) {
		this.authService.onLogout().subscribe(() => this.queryClient.clear());
	}

	/**
	 * Determina si la página actual es la de login.
	 */
	isLoginPage(): boolean {
		return this.router.url.includes("/login");
	}

	/**
	 * Determina si se debe mostrar la barra de navegación.
	 */
	showNavbar(): boolean {
		return this.authService.isLoggedIn() && !this.isLoginPage();
	}
}
