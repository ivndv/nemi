import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";

import { ConfiguracionAplicacionComponent } from "./configuracion-aplicacion.component";

describe("ConfiguracionAplicacionComponent", () => {
	let component: ConfiguracionAplicacionComponent;
	let fixture: ComponentFixture<ConfiguracionAplicacionComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ConfiguracionAplicacionComponent],
			imports: [
				HttpClientTestingModule,
				FormsModule,
				ReactiveFormsModule,
				NgSelectModule,
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ConfiguracionAplicacionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
