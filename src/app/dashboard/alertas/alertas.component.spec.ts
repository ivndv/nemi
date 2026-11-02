import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import Swal from "sweetalert2";
import { DashboardService } from "../services/dashboard.service";
import { AlertasComponent } from "./alertas.component";

jest.mock("sweetalert2", () => ({
	__esModule: true,
	default: {
		fire: jest.fn(),
	},
}));

class MockDashboardService {
	getAlertas = jest.fn();
}

class MockRouter {
	navigate = jest.fn();
}

describe("AlertasComponent", () => {
	let component: AlertasComponent;
	let fixture: ComponentFixture<AlertasComponent>;
	let dashboardService: DashboardService;
	let router: Router;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AlertasComponent],
			providers: [
				{ provide: DashboardService, useClass: MockDashboardService },
				{ provide: Router, useClass: MockRouter },
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(AlertasComponent);
		component = fixture.componentInstance;
		dashboardService = TestBed.inject(DashboardService);
		router = TestBed.inject(Router);
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should initialize counters to 0", () => {
		expect(component.licenciasProximasAVencer).toBe(0);
		expect(component.garantiasProximasAExpirar).toBe(0);
		expect(component.activosEnMantenimiento).toBe(0);
		expect(component.activosProximosADevolver).toBe(0);
	});

	it("should populate counters from service", () => {
		const mockAlertas = {
			data: {
				licencias_proximas_a_vencer: 3,
				garantias_proximas_a_expirar: 5,
				activos_en_mantenimiento: 2,
				activos_proximos_a_devolver: 4,
			},
		};

		(dashboardService.getAlertas as jest.Mock).mockReturnValue(of(mockAlertas));

		fixture.detectChanges();

		expect(component.licenciasProximasAVencer).toBe(3);
		expect(component.garantiasProximasAExpirar).toBe(5);
		expect(component.activosEnMantenimiento).toBe(2);
		expect(component.activosProximosADevolver).toBe(4);
	});

	it("should show Swal on error", () => {
		const errorResponse = {
			error: { mensaje: "Error al obtener alertas" },
		};

		(dashboardService.getAlertas as jest.Mock).mockReturnValue(
			throwError(() => errorResponse),
		);

		fixture.detectChanges();

		expect(Swal.fire).toHaveBeenCalledWith({
			icon: "error",
			text: "Error al obtener alertas",
			confirmButtonColor: "#0f766e",
		});
	});

	it("should navigate to gestion-activos with licencia_proxima filter", () => {
		component.navegarAFiltro("licencia_proxima");

		expect(router.navigate).toHaveBeenCalledWith(["/gestion-activos"], {
			queryParams: { licencia_proxima: "true" },
		});
	});

	it("should navigate to gestion-activos with garantia_proxima filter", () => {
		component.navegarAFiltro("garantia_proxima");

		expect(router.navigate).toHaveBeenCalledWith(["/gestion-activos"], {
			queryParams: { garantia_proxima: "true" },
		});
	});

	it("should navigate to gestion-activos with estado filter", () => {
		component.navegarAFiltro("estado");

		expect(router.navigate).toHaveBeenCalledWith(["/gestion-activos"], {
			queryParams: { estado: "En mantenimiento" },
		});
	});

	it("should navigate to gestion-activos with fecha_devolucion_proxima filter", () => {
		component.navegarAFiltro("fecha_devolucion_proxima");

		expect(router.navigate).toHaveBeenCalledWith(["/gestion-activos"], {
			queryParams: { fecha_devolucion_proxima: "true" },
		});
	});

	it("should have buttons disabled when counters are 0", () => {
		const mockAlertas = {
			data: {
				licencias_proximas_a_vencer: 0,
				garantias_proximas_a_expirar: 0,
				activos_en_mantenimiento: 0,
				activos_proximos_a_devolver: 0,
			},
		};

		(dashboardService.getAlertas as jest.Mock).mockReturnValue(of(mockAlertas));

		fixture.detectChanges();

		const buttons = fixture.nativeElement.querySelectorAll(".alert-action");
		buttons.forEach((btn: HTMLButtonElement) => {
			expect(btn.disabled).toBe(true);
		});
	});

	it("should have buttons enabled when counters are greater than 0", () => {
		const mockAlertas = {
			data: {
				licencias_proximas_a_vencer: 1,
				garantias_proximas_a_expirar: 1,
				activos_en_mantenimiento: 1,
				activos_proximos_a_devolver: 1,
			},
		};

		(dashboardService.getAlertas as jest.Mock).mockReturnValue(of(mockAlertas));

		fixture.detectChanges();

		const buttons = fixture.nativeElement.querySelectorAll(".alert-action");
		buttons.forEach((btn: HTMLButtonElement) => {
			expect(btn.disabled).toBe(false);
		});
	});

	it("should display counter values in count-badge elements", () => {
		const mockAlertas = {
			data: {
				licencias_proximas_a_vencer: 3,
				garantias_proximas_a_expirar: 5,
				activos_en_mantenimiento: 2,
				activos_proximos_a_devolver: 4,
			},
		};

		(dashboardService.getAlertas as jest.Mock).mockReturnValue(of(mockAlertas));

		fixture.detectChanges();

		const badges = fixture.nativeElement.querySelectorAll(".alert-count");
		expect(badges.length).toBe(4);
		expect(badges[0].textContent).toContain("3");
		expect(badges[1].textContent).toContain("5");
		expect(badges[2].textContent).toContain("2");
		expect(badges[3].textContent).toContain("4");
	});
});
