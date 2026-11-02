import { computed, Injectable, inject } from "@angular/core";
import {
	injectQuery,
	injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom } from "rxjs";
import { DatosService } from "../../activo/service/datos.service";
import { AuthService } from "../../login/services/auth.service";
import { getHttpErrorMessage } from "../http/http-error";

/**
 * Catálogos compartidos: tipos, ubicaciones, proveedores y dueños.
 * Una sola caché para todos los formularios.
 */
@Injectable({ providedIn: "root" })
export class CatalogosFacade {
	private readonly datosService = inject(DatosService);
	private readonly queryClient = injectQueryClient();
	private readonly authService = inject(AuthService);

	private get sesion(): string {
		const user = this.authService.getUserData();
		return `${user?.id ?? 0}:${user?.rol_slug ?? user?.rol ?? ""}`;
	}

	readonly query = injectQuery(() => ({
		queryKey: ["catalogos", "gestion-activos", this.sesion],
		queryFn: () =>
			firstValueFrom(this.datosService.obtenerDatosAuxiliares()).then(
				(response) => response.data,
			),
		staleTime: 10 * 60_000,
	}));

	readonly catalogos = computed(() => this.query.data() ?? null);
	readonly cargando = computed(() => this.query.isPending());
	readonly errorMessage = computed(() =>
		getHttpErrorMessage(this.query.error(), "Error al cargar catálogos"),
	);

	recargar(): Promise<unknown> {
		return this.query.refetch();
	}

	invalidar(): Promise<void> {
		return this.queryClient.invalidateQueries({
			queryKey: ["catalogos", "gestion-activos", this.sesion],
		});
	}
}
