import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

import { EditarAsignacionComponent } from "./editar-asignacion.component";

describe("EditarAsignacionComponent", () => {
	let component: EditarAsignacionComponent;
	let fixture: ComponentFixture<EditarAsignacionComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [EditarAsignacionComponent],
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

		fixture = TestBed.createComponent(EditarAsignacionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
