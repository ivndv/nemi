import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";

import { LoginComponent } from "./login.component";

describe("LoginComponent", () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [LoginComponent],
			imports: [HttpClientTestingModule, ReactiveFormsModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("inicia en el paso de presentación", () => {
		expect(component.step()).toBe("intro");
	});

	it("abre el formulario al pulsar el CTA", () => {
		component.abrirLogin();
		expect(component.step()).toBe("form");
	});

	it("vuelve a la presentación desde el formulario", () => {
		component.abrirLogin();
		component.volver();
		expect(component.step()).toBe("intro");
	});
});
