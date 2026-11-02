import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { NgSelectModule } from "@ng-select/ng-select";
import { of } from "rxjs";

import { provideQueryClientTesting } from "../../../testing/test-providers";
import { ActivosMutacionesFacade } from "../application/activos-mutaciones.facade";
import {
	ActivosHttpRepository,
	ActivosRepository,
} from "../infrastructure/activos.repository";
import { EditarActivoComponent } from "./editar-activo.component";

describe("EditarActivoComponent", () => {
	let component: EditarActivoComponent;
	let fixture: ComponentFixture<EditarActivoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [EditarActivoComponent],
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
				ActivosMutacionesFacade,
				{ provide: ActivosRepository, useExisting: ActivosHttpRepository },
				provideQueryClientTesting(),
				provideRouter([]),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(EditarActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
