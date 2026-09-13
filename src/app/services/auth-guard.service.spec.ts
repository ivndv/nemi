import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { AuthGuard } from "./auth-guard.service";

describe("AuthGuard", () => {
	let service: AuthGuard;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
		});
		service = TestBed.inject(AuthGuard);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
