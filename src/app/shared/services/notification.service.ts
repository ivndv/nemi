import { Injectable } from "@angular/core";
import { BehaviorSubject, map, Observable } from "rxjs";
import { DashboardService } from "../../dashboard/services/dashboard.service";

export interface AlertaItem {
	key: string;
	label: string;
	icon: string;
	count: number;
	filtro: string;
}

@Injectable({
	providedIn: "root",
})
export class NotificationService {
	private alertsSubject = new BehaviorSubject({
		activos_en_mantenimiento: 0,
		activos_proximos_a_devolver: 0,
		garantias_proximas_a_expirar: 0,
		licencias_proximas_a_vencer: 0,
	});

	alerts$ = this.alertsSubject.asObservable();

	totalAlerts$: Observable<number> = this.alerts$.pipe(
		map(
			(data) =>
				data.activos_en_mantenimiento +
				data.activos_proximos_a_devolver +
				data.garantias_proximas_a_expirar +
				data.licencias_proximas_a_vencer,
		),
	);

	alertasList$: Observable<AlertaItem[]> = this.alerts$.pipe(
		map((data) => [
			{
				key: "activos_en_mantenimiento",
				label: "Activos en mantenimiento",
				icon: "ph:wrench",
				count: data.activos_en_mantenimiento,
				filtro: "estado",
			},
			{
				key: "licencias_proximas_a_vencer",
				label: "Licencias próximas a vencer",
				icon: "ph:file-text",
				count: data.licencias_proximas_a_vencer,
				filtro: "licencia_proxima",
			},
			{
				key: "garantias_proximas_a_expirar",
				label: "Garantías próximas a expirar",
				icon: "ph:shield-check",
				count: data.garantias_proximas_a_expirar,
				filtro: "garantia_proxima",
			},
			{
				key: "activos_proximos_a_devolver",
				label: "Activos próximos a devolver",
				icon: "ph:arrow-arc-left",
				count: data.activos_proximos_a_devolver,
				filtro: "fecha_devolucion_proxima",
			},
		]),
	);

	constructor(private dashboardService: DashboardService) {}

	load(): void {
		this.dashboardService.getAlertas().subscribe({
			next: (response) => this.alertsSubject.next(response.data),
			error: () => {},
		});
	}
}
