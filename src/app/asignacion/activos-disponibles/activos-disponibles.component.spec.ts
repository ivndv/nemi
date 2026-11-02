import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideQueryClientTesting } from "../../../testing/test-providers";

import { ActivosDisponiblesComponent } from "./activos-disponibles.component";

describe("ActivosDisponiblesComponent", () => {
	let component: ActivosDisponiblesComponent;
	let fixture: ComponentFixture<ActivosDisponiblesComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ActivosDisponiblesComponent],
			imports: [HttpClientTestingModule],
			providers: [provideQueryClientTesting(), provideRouter([])],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ActivosDisponiblesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
