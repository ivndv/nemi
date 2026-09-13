import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

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
			],
		}).compileComponents();

		fixture = TestBed.createComponent(HistorialActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
