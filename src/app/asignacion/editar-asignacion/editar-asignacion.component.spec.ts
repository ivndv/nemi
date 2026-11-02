import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { NgSelectModule } from "@ng-select/ng-select";
import { of } from "rxjs";
import { provideQueryClientTesting } from "../../../testing/test-providers";

import { EditarAsignacionComponent } from "./editar-asignacion.component";

describe("EditarAsignacionComponent", () => {
	let component: EditarAsignacionComponent;
	let fixture: ComponentFixture<EditarAsignacionComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [EditarAsignacionComponent],
			imports: [HttpClientTestingModule, ReactiveFormsModule, NgSelectModule],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						params: of({}),
						snapshot: {
							paramMap: { get: () => null },
						},
					},
				},
				provideQueryClientTesting(),
				provideRouter([]),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(EditarAsignacionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
