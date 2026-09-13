import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

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
			],
		}).compileComponents();

		fixture = TestBed.createComponent(DetalleActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
