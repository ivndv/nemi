import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { of } from "rxjs";

import { provideQueryClientTesting } from "../../../testing/test-providers";
import { ActivosFacade } from "../application/activos.facade";
import {
	ActivosHttpRepository,
	ActivosRepository,
} from "../infrastructure/activos.repository";
import { ListaActivosComponent } from "./lista-activos.component";

describe("ListaActivosComponent", () => {
	let component: ListaActivosComponent;
	let fixture: ComponentFixture<ListaActivosComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ListaActivosComponent],
			imports: [HttpClientTestingModule],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						queryParams: of({}),
						params: of({}),
					},
				},
				ActivosFacade,
				{ provide: ActivosRepository, useExisting: ActivosHttpRepository },
				provideQueryClientTesting(),
				provideRouter([]),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ListaActivosComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
