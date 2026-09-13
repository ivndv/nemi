import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { HistorialService } from "./historial.service";

describe("HistorialService", () => {
	let service: HistorialService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
		});
		service = TestBed.inject(HistorialService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
