import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivosDisponiblesComponent } from "./activos-disponibles.component";

describe("ActivosDisponiblesComponent", () => {
	let component: ActivosDisponiblesComponent;
	let fixture: ComponentFixture<ActivosDisponiblesComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ActivosDisponiblesComponent],
			imports: [HttpClientTestingModule],
		}).compileComponents();

		fixture = TestBed.createComponent(ActivosDisponiblesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
