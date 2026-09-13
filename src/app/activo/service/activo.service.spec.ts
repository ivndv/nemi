import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { ActivoService } from "./activo.service";

describe("ActivoService", () => {
	let service: ActivoService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
		});
		service = TestBed.inject(ActivoService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
