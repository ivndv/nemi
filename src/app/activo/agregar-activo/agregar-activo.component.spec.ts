import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";

import { AgregarActivoComponent } from "./agregar-activo.component";

describe("AgregarActivoComponent", () => {
	let component: AgregarActivoComponent;
	let fixture: ComponentFixture<AgregarActivoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AgregarActivoComponent],
			imports: [HttpClientTestingModule, ReactiveFormsModule, NgSelectModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(AgregarActivoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
