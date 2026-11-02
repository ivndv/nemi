import { Injectable } from "@angular/core";
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
} from "@angular/router";
import Swal from "sweetalert2";
import { AuthService } from "../login/services/auth.service";

@Injectable({
	providedIn: "root",
})
export class RoleGuard implements CanActivate {
	constructor(
		private authService: AuthService,
		private router: Router,
	) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		_state: RouterStateSnapshot,
	): boolean {
		// Roles esperados: expectedRoles (arreglo) o expectedRole (texto)
		const configurados =
			route.data["expectedRoles"] ?? route.data["expectedRole"];
		const esperados: string[] = Array.isArray(configurados)
			? configurados
			: configurados
				? [configurados]
				: [];

		if (
			!this.authService.isLoggedIn() ||
			(esperados.length > 0 && !this.authService.hasAnyRole(esperados))
		) {
			// Mostrar una alerta premium de acceso denegado
			Swal.fire({
				icon: "error",
				title: "Acceso denegado",
				text: "No tienes permisos para acceder a esta sección.",
				confirmButtonText: "Entendido",
				buttonsStyling: false,
				customClass: {
					popup: "premium-swal-popup",
					title: "premium-swal-title",
					htmlContainer: "premium-swal-html",
					confirmButton: "premium-swal-confirm",
				},
			});

			this.router.navigate([
				this.authService.isEmpleado() ? "/gestion-activos" : "/dashboard",
			]);
			return false;
		}

		return true;
	}
}
