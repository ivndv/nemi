import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivosAsignadosComponent } from "./activos-asignados.component";

describe("ActivosAsignadosComponent", () => {
	let component: ActivosAsignadosComponent;
	let fixture: ComponentFixture<ActivosAsignadosComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ActivosAsignadosComponent],
			imports: [HttpClientTestingModule],
		}).compileComponents();

		fixture = TestBed.createComponent(ActivosAsignadosComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
