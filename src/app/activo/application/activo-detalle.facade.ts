import { computed, Injectable, inject, signal } from "@angular/core";
import {
	injectMutation,
	injectQuery,
	injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { AuthService } from "../../login/services/auth.service";
import { ActivosRepository } from "../infrastructure/activos.repository";

/**
 * Estado y casos de uso del detalle de un activo.
 */
@Injectable()
export class ActivoDetalleFacade {
	private readonly repository = inject(ActivosRepository);
	private readonly queryClient = injectQueryClient();
	private readonly authService = inject(AuthService);

	private get sesion(): string {
		const user = this.authService.getUserData();
		return `${user?.id ?? 0}:${user?.rol_slug ?? user?.rol ?? ""}`;
	}

	readonly activoId = signal<number | null>(null);

	readonly activoQuery = injectQuery(() => {
		const id = this.activoId();

		return {
			queryKey: ["activos", "detalle", this.sesion, id],
			queryFn: () => {
				if (!id) throw new Error("ID de activo inválido");
				return this.repository.detalle(id);
			},
			enabled: !!id && id > 0,
			staleTime: 60_000,
		};
	});

	readonly activo = computed(() => {
		const data = this.activoQuery.data();
		if (!data) return null;

		return {
			...data,
			garantia: data.garantia ?? [],
		};
	});

	readonly cargando = computed(() => this.activoQuery.isPending());

	readonly errorMessage = computed(() =>
		getHttpErrorMessage(this.activoQuery.error(), "Error al obtener el activo"),
	);

	readonly bajaMutation = injectMutation(() => ({
		mutationFn: (id: number) => this.repository.darDeBaja(id),
		onSuccess: () => {
			this.queryClient.removeQueries({ queryKey: ["activos", "detalle"] });
			this.queryClient.invalidateQueries({ queryKey: ["activos", "lista"] });
		},
	}));

	setActivoId(id: number): void {
		this.activoId.set(id);
	}

	darDeBaja(): Promise<unknown> {
		const id = this.activoId();
		if (!id) return Promise.reject(new Error("Activo no cargado"));
		return this.bajaMutation.mutateAsync(id);
	}
}
