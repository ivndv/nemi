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
import {
	applyChartDefaults,
	barChartOptions,
	CHART_PALETTE,
	getChartTheme,
	pieChartOptions,
	withAlpha,
} from "../../utils/chartTheme";
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

	porcentajeDelTotal(valor: number): string {
		if (!this.totalActivos) return "0";
		return ((valor / this.totalActivos) * 100).toFixed(0);
	}

	get totalTendencia(): number {
		return this.tendenciaMensualData.data.reduce(
			(total, valor) => total + valor,
			0,
		);
	}

	ngOnInit(): void {
		applyChartDefaults();
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
					this.cdr.markForCheck();
				},
			});
	}

	private porcentajeConDecimales(valor: number): string {
		if (!this.totalActivos) return "0.0";
		return ((valor / this.totalActivos) * 100).toFixed(1);
	}

	private initGraficoActivosVsDisponibles(): void {
		const canvas = this.activosVsDisponibles.nativeElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Destruir instancia previa si existe
		if (this.chartPie) {
			this.chartPie.destroy();
		}

		const porcentajeAsignados = this.porcentajeConDecimales(
			this.activosAsignados,
		);
		const porcentajeDisponibles = this.porcentajeConDecimales(
			this.activosDisponibles,
		);

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
						backgroundColor: [CHART_PALETTE[1], CHART_PALETTE[5]],
						borderColor: getChartTheme().surface,
						borderWidth: 3,
						hoverOffset: 4,
					},
				],
			},
			options: pieChartOptions(),
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
						label: "Activos registrados",
						data: this.tendenciaMensualData.data,
						backgroundColor: withAlpha(CHART_PALETTE[0], 0.72),
						borderColor: CHART_PALETTE[0],
						borderWidth: 1,
						borderRadius: 6,
						maxBarThickness: 34,
					},
				],
			},
			options: barChartOptions(),
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
