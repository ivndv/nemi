import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

import { provideQueryClientTesting } from "../../../testing/test-providers";
import { HistorialActivoComponent } from "./historial-activo.component";

describe("HistorialActivoComponent", () => {
	let component: HistorialActivoComponent;
	let fixture: ComponentFixture<HistorialActivoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [HistorialActivoComponent],
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
				provideQueryClientTesting(),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(HistorialActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
