import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
} from "@angular/core";
import {
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Legend,
	LinearScale,
	PieController,
	Tooltip,
} from "chart.js";
import { Subject, takeUntil } from "rxjs";
import { DashboardService } from "../services/dashboard.service";

// Registrar componentes necesarios de Chart.js
Chart.register(
	PieController,
	BarController,
	CategoryScale,
	LinearScale,
	ArcElement,
	Tooltip,
	Legend,
	BarElement,
);

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-resumen-activos",
	standalone: false,
	templateUrl: "./resumen-activos.component.html",
	styleUrl: "./resumen-activos.component.css",
})
export class ResumenActivosComponent implements OnInit, OnDestroy {
	totalActivos: number = 0; // Total de activos registrados
	activosAsignados: number = 0; // Activos asignados
	activosDisponibles: number = 0; // Activos disponibles
	activosEnMantenimiento: number = 0; // Activos en mantenimiento
	activosDadosDeBaja: number = 0; // Activos dados de baja
	tendenciaMensualData: { labels: string[]; data: number[] } = {
		labels: [],
		data: [],
	}; // Datos de la tendencia mensual
	anoTendencia: number = new Date().getFullYear(); // Año que abarca la tendencia
	errorMessage = ""; // Mensaje de error en caso de fallo
	private destroy$ = new Subject<void>();

	@ViewChild("activosVsDisponibles") activosVsDisponibles!: ElementRef;
	@ViewChild("tendenciaMensual") tendenciaMensual!: ElementRef;

	private chartPie: Chart | undefined;
	private chartBar: Chart | undefined;

	constructor(
		private cdr: ChangeDetectorRef,
		private dashboardService: DashboardService,
	) {}

	ngOnInit(): void {
		this.cargarDatosBackend();
	}

	private cargarDatosBackend(): void {
		this.dashboardService
			.getResumen()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.totalActivos = Number(response.data.total_activos) || 0;
					this.activosAsignados = Number(response.data.activos_asignados) || 0;
					this.activosDisponibles =
						Number(response.data.activos_disponibles) || 0;
					this.activosEnMantenimiento =
						Number(response.data.activos_en_mantenimiento) || 0;
					this.activosDadosDeBaja =
						Number(response.data.activos_dados_de_baja) || 0;

					if (response.data.tendencia_mensual) {
						this.tendenciaMensualData = {
							labels: response.data.tendencia_mensual.labels || [],
							data: response.data.tendencia_mensual.data || [],
						};
					}

					this.anoTendencia =
						response.data.ano_tendencia || new Date().getFullYear();
					this.cdr.markForCheck();

					// Inicializar o actualizar gráficas
					this.initGraficoActivosVsDisponibles();
					this.initGraficoTendenciaMensual();
				},
				error: (error) => {
					const errorMessage =
						error.error?.mensaje || "Error al cargar datos del dashboard";
					this.errorMessage = errorMessage;
					console.error("Error del backend:", errorMessage);
				},
			});
	}

	private initGraficoActivosVsDisponibles(): void {
		const canvas = this.activosVsDisponibles.nativeElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Destruir instancia previa si existe
		if (this.chartPie) {
			this.chartPie.destroy();
		}

		const porcentajeAsignados =
			((this.activosAsignados / this.totalActivos) * 100).toFixed(1) || "0.0";
		const porcentajeDisponibles =
			((this.activosDisponibles / this.totalActivos) * 100).toFixed(1) || "0.0";

		this.chartPie = new Chart(ctx, {
			type: "pie",
			data: {
				labels: [
					`Asignados (${porcentajeAsignados}%)`,
					`Disponibles (${porcentajeDisponibles}%)`,
				],
				datasets: [
					{
						data: [this.activosAsignados, this.activosDisponibles],
						backgroundColor: ["#3182ce", "#38a169"],
						borderColor: ["#ffffff", "#ffffff"],
						borderWidth: 2,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: "bottom",
						labels: { boxWidth: 12, padding: 20, font: { size: 11 } },
					},
					tooltip: { padding: 12, bodyFont: { size: 13 } },
				},
			},
		});
	}

	private initGraficoTendenciaMensual(): void {
		const canvas = this.tendenciaMensual.nativeElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Destruir instancia previa si existe
		if (this.chartBar) {
			this.chartBar.destroy();
		}

		this.chartBar = new Chart(ctx, {
			type: "bar",
			data: {
				labels: this.tendenciaMensualData.labels,
				datasets: [
					{
						label: "Activos Registrados",
						data: this.tendenciaMensualData.data,
						backgroundColor: "rgba(49, 130, 206, 0.7)",
						borderColor: "#3182ce",
						borderWidth: 1,
						borderRadius: 4,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: { padding: 12 },
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { display: true, color: "#edf2f7" },
						ticks: { stepSize: 1 },
					},
					x: { grid: { display: false } },
				},
			},
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
