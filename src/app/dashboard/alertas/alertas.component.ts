import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { DashboardService } from "../services/dashboard.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-alertas",
	standalone: false,
	templateUrl: "./alertas.component.html",
	styleUrl: "./alertas.component.css",
})
export class AlertasComponent implements OnInit, OnDestroy {
	// Variables para almacenar los datos de las alertas
	licenciasProximasAVencer: number = 0;
	garantiasProximasAExpirar: number = 0;
	activosEnMantenimiento: number = 0;
	activosProximosADevolver: number = 0;
	errorMessage = "";
	private destroy$ = new Subject<void>();

	constructor(
		private cdr: ChangeDetectorRef,
		private dashboardService: DashboardService,
		private router: Router,
	) {}

	ngOnInit(): void {
		this.cargarDatosBackend(); // Cargar datos al inicializar el componente
	}

	/**
	 * Función para cargar los datos del backend.
	 * Realiza una llamada al servicio `DashboardService` y asigna los datos recibidos a las variables correspondientes.
	 */

	private cargarDatosBackend(): void {
		this.dashboardService
			.getAlertas()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log("Datos recibidos del backend:", response); // Log para verificar los datos

					// Asignar los datos recibidos a las variables
					this.licenciasProximasAVencer =
						response.data.licencias_proximas_a_vencer || 0;
					this.garantiasProximasAExpirar =
						response.data.garantias_proximas_a_expirar || 0;
					this.activosEnMantenimiento =
						response.data.activos_en_mantenimiento || 0;
					this.activosProximosADevolver =
						response.data.activos_proximos_a_devolver || 0;
					this.cdr.markForCheck();

					// Log para confirmar que los datos se han asignado correctamente
					console.log("Datos asignados:", {
						licenciasProximasAVencer: this.licenciasProximasAVencer,
						garantiasProximasAExpirar: this.garantiasProximasAExpirar,
						activosEnMantenimiento: this.activosEnMantenimiento,
						activosProximosADevolver: this.activosProximosADevolver,
					});
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { mensaje: "Error al actualizar la asignación" }
					const errorMessage =
						error.error?.mensaje || "Error al actualizar la asignación";

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
	//Funcion para navegar a la vista de gestión de activos con un filtro específico
	navegarAFiltro(filtro: string): void {
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

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
