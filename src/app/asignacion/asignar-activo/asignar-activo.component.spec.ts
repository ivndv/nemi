import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

import { AsignarActivoComponent } from "./asignar-activo.component";

describe("AsignarActivoComponent", () => {
	let component: AsignarActivoComponent;
	let fixture: ComponentFixture<AsignarActivoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AsignarActivoComponent],
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

		fixture = TestBed.createComponent(AsignarActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
