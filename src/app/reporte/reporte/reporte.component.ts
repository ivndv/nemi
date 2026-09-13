import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Chart } from "chart.js/auto";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { SelectItem } from "../../models/datos-auxiliares.interface";
import {
	DatosAuxiliaresResponse,
	ReporteFiltros,
	ReporteResponse,
	TipoReporte,
	TiposReporteResponse,
} from "../../models/reporte.interface";
import { DatosAuxiliaresService } from "../service/datos-auxiliares.service";
import { ReporteService } from "../service/reporte.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-reporte",
	standalone: false,
	templateUrl: "./reporte.component.html",
	styleUrl: "./reporte.component.css",
})
export class ReporteComponent implements OnInit, AfterViewInit, OnDestroy {
	today: Date = new Date();
	reportForm!: FormGroup;

	tiposActivo: SelectItem[] = [];
	usuarios: SelectItem[] = [];
	ubicaciones: SelectItem[] = [];
	proveedores: SelectItem[] = [];
	tiposReporte: TipoReporte[] = [];
	errorMessage: string | null = null;
	private destroy$ = new Subject<void>();

	reporte = {
		tipo_reporte: "",
		descripcion: "",
		filtros: {
			tipo_activo: "",
			usuario: "",
			ubicacion: "",
			proveedor: "",
			fecha_inicio: null as string | null,
			fecha_fin: null as string | null,
		},
		resultados: {
			detalles: [] as Record<string, string | number>[],
			resumen: {} as Record<string, number>,
		},
	};

	@ViewChild("graficaPastel") graficaPastel!: ElementRef;
	@ViewChild("graficaBarras") graficaBarras!: ElementRef;

	constructor(
		private reporteService: ReporteService,
		private datosAuxiliaresService: DatosAuxiliaresService,
		private fb: FormBuilder,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.initForm();
		this.fetchTiposReporte();
		this.fetchDatosAuxiliares();
	}
	ngAfterViewInit(): void {}

	initForm(): void {
		this.reportForm = this.fb.group({
			tipo_reporte: ["", Validators.required],
			descripcion: [{ value: "", disabled: false }],
			tipo_activo_id: [""],
			fecha_inicio: [""],
			fecha_fin: [""],
			usuario_id: [""],
			ubicacion_id: [""],
			proveedor_id: [""],
		});
		this.reportForm
			.get("tipo_reporte")
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((tipoId) => {
				this.actualizarDescripcion(tipoId);
			});
	}

	fetchTiposReporte(): void {
		this.reporteService
			.getTiposReporte()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: TiposReporteResponse) => {
					this.tiposReporte = response.data.tiposReporte || [];
				},
				error: (error) => {
					const errorMessage =
						error.error?.error || "Error al cargar los tipos de reporte.";
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

	fetchDatosAuxiliares(): void {
		this.datosAuxiliaresService
			.getDatosAuxiliares()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: DatosAuxiliaresResponse) => {
					console.log("[DEBUG] Datos auxiliares recibidos:", response);

					this.tiposActivo = response.data.tiposActivo || [];
					this.usuarios = response.data.usuarios || [];
					this.ubicaciones = response.data.ubicaciones || [];
					this.proveedores = response.data.proveedores || [];

					console.log("[INFO] Datos auxiliares asignados correctamente.");
				},
				error: (error) => {
					const errorMessage =
						error.error?.message || "Error al cargar los tipos de reporte.";
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

	actualizarDescripcion(tipoId: number): void {
		if (!tipoId) {
			this.reportForm.get("descripcion")?.setValue(""); // Limpia si no hay selección
			return;
		}

		const tipoSeleccionado = this.tiposReporte.find(
			(tipo) => tipo.id === tipoId,
		);
		const descripcion = tipoSeleccionado?.descripcion || "";

		this.reportForm.get("descripcion")?.setValue(descripcion); // Asigna la descripción
	}

	generarReporte(tipo_id: number, filtros: ReporteFiltros): void {
		this.reporteService
			.generarReporte(tipo_id, filtros)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: ReporteResponse) => {
					console.log("[INFO] Datos del reporte generados:", response);
					this.reporte = { ...this.reporte, ...response.data };
					this.cdr.detectChanges();
					this.initGraficaPastel();
					this.initGraficaBarras();
				},
				error: (error) => {
					const errorMessage =
						error.error?.error || "Error al generar el reporte.";
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
	onLimpiar(): void {
		this.reportForm.reset(); // Limpiar el formulario
	}

	onSubmit(): void {
		console.log("[DEBUG] Estado del formulario:", this.reportForm.status);
		console.log("[DEBUG] Valores del formulario:", this.reportForm.value);

		if (this.reportForm.valid) {
			const formValues = this.reportForm.value;
			const { tipo_reporte, ...filtrosRaw } = formValues;

			const filtros: ReporteFiltros = {};
			for (const key in filtrosRaw) {
				if (filtrosRaw[key] !== null && filtrosRaw[key] !== "") {
					(filtros as Record<string, unknown>)[key] = filtrosRaw[key];
				}
			}

			console.log("[DEBUG] Filtros generados:", filtros);

			this.generarReporte(tipo_reporte, filtros);
		} else {
			console.error("[ERROR] El formulario no es válido.");
			console.log("[DEBUG] Errores del formulario:", this.reportForm.errors);
			console.log(
				"[DEBUG] Errores de los controles:",
				this.reportForm.controls,
			);
		}
	}
	getColumnas(): string[] {
		const detalles = this.reporte.resultados?.detalles;
		if (detalles && detalles.length > 0) {
			return Object.keys(detalles[0]);
		}
		return [];
	}

	trackById(_index: number, item: Record<string, string | number>): number {
		return Number(item["id"]);
	}

	trackByIndex(index: number): number {
		return index;
	}

	getResumenEntries(): [string, number][] {
		return Object.entries(this.reporte.resultados?.resumen || {});
	}

	private chartPastel: Chart<"pie"> | null = null;
	private chartBarras: Chart<"bar"> | null = null;

	initGraficaPastel(): void {
		if (!this.graficaPastel?.nativeElement) return;
		const canvas = this.graficaPastel.nativeElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Destruir la instancia anterior si existe
		if (this.chartPastel) {
			this.chartPastel.destroy();
		}

		const resumen = this.getResumenEntries();
		if (resumen.length === 0) {
			console.warn("[WARN] No hay datos para generar la gráfica de pastel.");
			return;
		}

		const labels = resumen.map((item) => item[0]);
		const data = resumen.map((item) => item[1]);

		this.chartPastel = new Chart(ctx, {
			type: "pie",
			data: {
				labels: labels,
				datasets: [
					{
						data: data,
						backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: { position: "top" },
					title: { display: true, text: "Distribución por Categoría" },
				},
			},
		});
	}

	initGraficaBarras(): void {
		if (!this.graficaBarras?.nativeElement) return;
		const canvas = this.graficaBarras.nativeElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Destruir la instancia anterior si existe
		if (this.chartBarras) {
			this.chartBarras.destroy();
		}

		const resumen = this.getResumenEntries();
		const labels = resumen.map((item) => item[0]);
		const data = resumen.map((item) => item[1]);

		this.chartBarras = new Chart(ctx, {
			type: "bar",
			data: {
				labels: labels,
				datasets: [
					{
						label: "Cantidad",
						data: data,
						backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: { position: "top" },
					title: { display: true, text: "Cantidad por Categoría" },
				},
			},
		});
	}

	async exportToPDF(): Promise<void> {
		if (!this.reporte.resultados?.detalles?.length) {
			console.error("No hay datos para exportar");
			return;
		}

		const doc = new jsPDF("p", "mm", "a4");
		const date = new Date().toLocaleDateString();

		try {
			const element = document.getElementById("pdf-export-content");

			if (!element) {
				throw new Error("No se encontró el elemento a exportar");
			}

			const canvas = await html2canvas(element, {
				scale: 1,
				logging: false,
				useCORS: true,
				allowTaint: true,
				scrollY: -window.scrollY,
			});

			// 3. Añade la imagen al PDF
			const imgData = canvas.toDataURL("image/png");
			const imgWidth = doc.internal.pageSize.getWidth() - 20; // Margen
			const imgHeight = (canvas.height * imgWidth) / canvas.width;

			doc.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

			// 4. Guardar
			doc.save(`reporte_completo_${date}.pdf`);
		} catch (error) {
			console.error("Error al generar PDF:", error);
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
