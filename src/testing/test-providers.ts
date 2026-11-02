import { provideRouter } from "@angular/router";
import {
	provideTanStackQuery,
	QueryClient,
} from "@tanstack/angular-query-experimental";

/**
 * QueryClient aislado para pruebas: sin reintentos y sin caché persistente.
 */
export function provideQueryClientTesting() {
	return provideTanStackQuery(
		new QueryClient({
			defaultOptions: {
				queries: { retry: false, gcTime: 0 },
				mutations: { retry: false },
			},
		}),
	);
}

/** Router vacío para componentes que inyectan Router o Location. */
export function provideRouterTesting() {
	return provideRouter([]);
}
