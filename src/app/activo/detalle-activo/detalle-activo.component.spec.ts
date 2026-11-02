import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { of } from "rxjs";

import { provideQueryClientTesting } from "../../../testing/test-providers";
import { ActivoDetalleFacade } from "../application/activo-detalle.facade";
import {
	ActivosHttpRepository,
	ActivosRepository,
} from "../infrastructure/activos.repository";
import { DetalleActivoComponent } from "./detalle-activo.component";

describe("DetalleActivoComponent", () => {
	let component: DetalleActivoComponent;
	let fixture: ComponentFixture<DetalleActivoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DetalleActivoComponent],
			imports: [HttpClientTestingModule],
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
				ActivoDetalleFacade,
				{ provide: ActivosRepository, useExisting: ActivosHttpRepository },
				provideQueryClientTesting(),
				provideRouter([]),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(DetalleActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
