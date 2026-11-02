import { computed, Injectable, inject } from "@angular/core";
import {
	injectMutation,
	injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { ActivosRepository } from "../infrastructure/activos.repository";

/**
 * Mutaciones de activos con invalidación de caché.
 */
@Injectable()
export class ActivosMutacionesFacade {
	private readonly repository = inject(ActivosRepository);
	private readonly queryClient = injectQueryClient();

	readonly crearMutation = injectMutation(() => ({
		mutationFn: (formData: FormData) => this.repository.crear(formData),
		onSuccess: () => {
			this.queryClient.invalidateQueries({ queryKey: ["activos", "lista"] });
		},
	}));

	readonly editarMutation = injectMutation(() => ({
		mutationFn: (payload: { id: number; formData: FormData }) =>
			this.repository.editar(payload.id, payload.formData),
		onSuccess: (_data, variables) => {
			this.queryClient.invalidateQueries({ queryKey: ["activos", "lista"] });
			this.queryClient.invalidateQueries({
				queryKey: ["activos", "detalle", variables.id],
			});
		},
	}));

	readonly guardando = computed(
		() => this.crearMutation.isPending() || this.editarMutation.isPending(),
	);

	crear(formData: FormData) {
		return this.crearMutation.mutateAsync(formData);
	}

	editar(id: number, formData: FormData) {
		return this.editarMutation.mutateAsync({ id, formData });
	}
}
