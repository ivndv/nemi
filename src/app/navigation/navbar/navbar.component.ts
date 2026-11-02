import { ChangeDetectionStrategy, Component } from "@angular/core";
import Swal from "sweetalert2";
import { AuthService } from "../../login/services/auth.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-navbar",
	standalone: false,
	templateUrl: "./navbar.component.html",
	styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
	constructor(private authService: AuthService) {}

	isAdmin(): boolean {
		return this.authService.isAdmin();
	}

	/**
	 * Roles que operan inventario, asignaciones o mantenimiento.
	 */
	puedeOperar(): boolean {
		return this.authService.puedeOperar();
	}

	puedeMantenimiento(): boolean {
		return this.authService.puedeMantenimiento();
	}

	/**
	 * El empleado solo consulta lo suyo.
	 */
	isEmpleado(): boolean {
		return this.authService.isEmpleado();
	}

	/**
	 * Cierra la sesión del usuario.
	 */
	cerrarSesion(): void {
		Swal.fire({
			title: "¿Cerrar Sesión?",
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
			if (result.isConfirmed) {
				this.authService.logout();
			}
		});
	}
}
