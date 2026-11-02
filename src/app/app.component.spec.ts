import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { provideQueryClientTesting } from "../testing/test-providers";
import { AppComponent } from "./app.component";
import { AuthService } from "./login/services/auth.service";

describe("AppComponent", () => {
	let authServiceMock: jest.Mocked<
		Pick<AuthService, "isLoggedIn" | "onLogout">
	>;

	beforeEach(waitForAsync(() => {
		authServiceMock = {
			isLoggedIn: jest.fn().mockReturnValue(false),
			onLogout: jest.fn().mockReturnValue(of()),
		};

		TestBed.configureTestingModule({
			imports: [RouterTestingModule],
			declarations: [AppComponent],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				provideQueryClientTesting(),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	it("should create the app", () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it("should render header and footer", () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-header")).toBeTruthy();
		expect(compiled.querySelector("app-footer")).toBeTruthy();
	});
});
