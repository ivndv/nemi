import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { AsignacionService } from "./asignacion.service";

describe("AsignacionService", () => {
	let service: AsignacionService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
		});
		service = TestBed.inject(AsignacionService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
