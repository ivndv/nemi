import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { ReporteService } from "./reporte.service";

describe("ReporteService", () => {
	let service: ReporteService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
		});
		service = TestBed.inject(ReporteService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
