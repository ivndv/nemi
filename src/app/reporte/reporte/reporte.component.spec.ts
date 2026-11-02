jest.mock("jspdf", () => ({}));
jest.mock("jspdf-autotable", () => ({}));
jest.mock("html2canvas", () => ({}));
jest.mock("chart.js/auto", () => ({}));

import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { provideRouter } from "@angular/router";
import { NgSelectModule } from "@ng-select/ng-select";
import { provideQueryClientTesting } from "../../../testing/test-providers";

import { ReporteComponent } from "./reporte.component";

describe("ReporteComponent", () => {
	let component: ReporteComponent;
	let fixture: ComponentFixture<ReporteComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ReporteComponent],
			imports: [HttpClientTestingModule, ReactiveFormsModule, NgSelectModule],
			providers: [provideQueryClientTesting(), provideRouter([])],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ReporteComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
