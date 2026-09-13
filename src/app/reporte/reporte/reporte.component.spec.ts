jest.mock("jspdf", () => ({}));
jest.mock("jspdf-autotable", () => ({}));
jest.mock("html2canvas", () => ({}));
jest.mock("chart.js/auto", () => ({}));

import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReporteComponent } from "./reporte.component";

describe("ReporteComponent", () => {
	let component: ReporteComponent;
	let fixture: ComponentFixture<ReporteComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ReporteComponent],
			imports: [HttpClientTestingModule],
		}).compileComponents();

		fixture = TestBed.createComponent(ReporteComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
