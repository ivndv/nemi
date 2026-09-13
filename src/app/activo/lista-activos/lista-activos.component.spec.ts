import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

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
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ListaActivosComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
