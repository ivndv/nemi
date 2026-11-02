import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideQueryClientTesting } from "../../../testing/test-providers";
import { ActivosAsignadosComponent } from "./activos-asignados.component";

describe("ActivosAsignadosComponent", () => {
	let component: ActivosAsignadosComponent;
	let fixture: ComponentFixture<ActivosAsignadosComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ActivosAsignadosComponent],
			imports: [HttpClientTestingModule],
			providers: [provideQueryClientTesting(), provideRouter([])],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ActivosAsignadosComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
