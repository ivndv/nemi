import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DashboardResumen } from "../../models/dashboard.interface";
import { DashboardService } from "../services/dashboard.service";
import { ResumenActivosComponent } from "./resumen-activos.component";

class MockDashboardService {
	getResumen = jest.fn();
}

describe("ResumenActivosComponent", () => {
	let component: ResumenActivosComponent;
	let fixture: ComponentFixture<ResumenActivosComponent>;
	let dashboardService: DashboardService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ResumenActivosComponent],
			providers: [
				{ provide: DashboardService, useClass: MockDashboardService },
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ResumenActivosComponent);
		component = fixture.componentInstance;
		dashboardService = TestBed.inject(DashboardService);
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should initialize all counters to 0", () => {
		expect(component.totalActivos).toBe(0);
		expect(component.activosAsignados).toBe(0);
		expect(component.activosDisponibles).toBe(0);
		expect(component.activosEnMantenimiento).toBe(0);
		expect(component.activosDadosDeBaja).toBe(0);
	});

	it("should populate all 5 counters from service", () => {
		const mockResponse: DashboardResumen = {
			data: {
				total_activos: 10,
				activos_asignados: 4,
				activos_disponibles: 3,
				activos_en_mantenimiento: 2,
				activos_dados_de_baja: 1,
				tendencia_mensual: { labels: ["Ene", "Feb"], data: [5, 5] },
				ano_tendencia: 2025,
			},
		};

		(dashboardService.getResumen as jest.Mock).mockReturnValue(
			of(mockResponse),
		);

		fixture.detectChanges();

		expect(component.totalActivos).toBe(10);
		expect(component.activosAsignados).toBe(4);
		expect(component.activosDisponibles).toBe(3);
		expect(component.activosEnMantenimiento).toBe(2);
		expect(component.activosDadosDeBaja).toBe(1);
	});

	it("should render 5 badges in the template", () => {
		const mockResponse: DashboardResumen = {
			data: {
				total_activos: 5,
				activos_asignados: 2,
				activos_disponibles: 2,
				activos_en_mantenimiento: 1,
				activos_dados_de_baja: 0,
				tendencia_mensual: { labels: [], data: [] },
				ano_tendencia: 2025,
			},
		};

		(dashboardService.getResumen as jest.Mock).mockReturnValue(
			of(mockResponse),
		);

		fixture.detectChanges();

		const badges = fixture.nativeElement.querySelectorAll(".kpi-card");
		expect(badges.length).toBe(5);
	});

	it("should display correct values in badge--numero elements", () => {
		const mockResponse: DashboardResumen = {
			data: {
				total_activos: 15,
				activos_asignados: 7,
				activos_disponibles: 5,
				activos_en_mantenimiento: 2,
				activos_dados_de_baja: 1,
				tendencia_mensual: { labels: [], data: [] },
				ano_tendencia: 2025,
			},
		};

		(dashboardService.getResumen as jest.Mock).mockReturnValue(
			of(mockResponse),
		);

		fixture.detectChanges();

		const numeros = fixture.nativeElement.querySelectorAll(".stat-value");
		expect(numeros.length).toBe(5);
		expect(numeros[0].textContent).toContain("15"); // Total
		expect(numeros[1].textContent).toContain("7"); // Asignados
		expect(numeros[2].textContent).toContain("5"); // Disponibles
		expect(numeros[3].textContent).toContain("2"); // Mantenimiento
		expect(numeros[4].textContent).toContain("1"); // Baja
	});

	it("should display correct titles in badge--titulo elements", () => {
		const mockResponse: DashboardResumen = {
			data: {
				total_activos: 0,
				activos_asignados: 0,
				activos_disponibles: 0,
				activos_en_mantenimiento: 0,
				activos_dados_de_baja: 0,
				tendencia_mensual: { labels: [], data: [] },
				ano_tendencia: 2025,
			},
		};

		(dashboardService.getResumen as jest.Mock).mockReturnValue(
			of(mockResponse),
		);

		fixture.detectChanges();

		const titulos = fixture.nativeElement.querySelectorAll(".stat-label");
		expect(titulos.length).toBe(5);
		expect(titulos[0].textContent).toContain("Total");
		expect(titulos[1].textContent).toContain("Asignados");
		expect(titulos[2].textContent).toContain("Disponibles");
		expect(titulos[3].textContent).toContain("Mantenimiento");
		expect(titulos[4].textContent).toContain("Baja");
	});

	it("should handle zeros when response has null values", () => {
		const mockResponse: DashboardResumen = {
			data: {
				total_activos: 0,
				activos_asignados: 0,
				activos_disponibles: 0,
				activos_en_mantenimiento: 0,
				activos_dados_de_baja: 0,
				tendencia_mensual: undefined,
				ano_tendencia: undefined,
			},
		};

		(dashboardService.getResumen as jest.Mock).mockReturnValue(
			of(mockResponse),
		);

		fixture.detectChanges();

		expect(component.totalActivos).toBe(0);
		expect(component.activosEnMantenimiento).toBe(0);
		expect(component.activosDadosDeBaja).toBe(0);
	});

	it("should set errorMessage on service error", () => {
		(dashboardService.getResumen as jest.Mock).mockReturnValue(
			throwError(() => ({ error: { mensaje: "Error al cargar" } })),
		);

		fixture.detectChanges();

		expect(component.errorMessage).toBe("Error al cargar");
	});
});
