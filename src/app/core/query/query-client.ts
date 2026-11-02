import { QueryClient } from "@tanstack/angular-query-experimental";

/**
 * Cliente global de TanStack Query.
 * Centraliza la política de caché del estado del servidor.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 5 * 60_000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
		mutations: {
			retry: 0,
		},
	},
});
