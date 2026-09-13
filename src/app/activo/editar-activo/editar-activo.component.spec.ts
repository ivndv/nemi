import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

import { EditarActivoComponent } from "./editar-activo.component";

describe("EditarActivoComponent", () => {
	let component: EditarActivoComponent;
	let fixture: ComponentFixture<EditarActivoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [EditarActivoComponent],
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

		fixture = TestBed.createComponent(EditarActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
