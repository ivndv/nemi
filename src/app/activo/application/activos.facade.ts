import { computed, Injectable, inject, signal } from "@angular/core";
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { CatalogosFacade } from "../../core/catalogos/catalogos.facade";
import { AuthService } from "../../login/services/auth.service";
import type { SelectItem } from "../../models/datos-auxiliares.interface";
import {
	type ActivosQuery,
	ActivosRepository,
} from "../infrastructure/activos.repository";

export interface OpcionFiltro {
	id: number | string;
	nombre: string;
}

/**
 * Estado y casos de uso de la lista de activos.
 * La UI consume señales; TanStack se encarga del estado del servidor.
 */
@Injectable()
export class ActivosFacade {
	private readonly repository = inject(ActivosRepository);
	private readonly catalogosFacade = inject(CatalogosFacade);
	private readonly authService = inject(AuthService);

	private get sesion(): string {
		const user = this.authService.getUserData();
		return `${user?.id ?? 0}:${user?.rol_slug ?? user?.rol ?? ""}`;
	}

	readonly pagina = signal(1);
	readonly limite = signal(10);
	readonly busqueda = signal("");
	readonly filtro = signal("");
	readonly opcion = signal("");
	readonly orden = signal("asc");

	readonly opcionesFiltro = computed<OpcionFiltro[]>(() => {
		const data = this.catalogosFacade.catalogos();
		if (!data) return [];

		const mapOpciones = (items?: SelectItem[]): OpcionFiltro[] =>
			(items ?? []).map((item) => ({
				id: item.id,
				nombre: item.nombre || item.descripcion || "",
			}));

		switch (this.filtro()) {
			case "estado":
				return mapOpciones(data.estados);
			case "tipo":
				return mapOpciones(data.tipos);
			case "ubicacion":
				return mapOpciones(data.ubicaciones);
			case "usuario_asignado":
				return mapOpciones(data.duenos);
			default:
				return [];
		}
	});

	readonly activosQuery = injectQuery(() => ({
		queryKey: [
			"activos",
			"lista",
			{
				sesion: this.sesion,
				pagina: this.pagina(),
				limite: this.limite(),
				busqueda: this.busqueda(),
				filtro: this.filtro(),
				opcion: this.opcion(),
				orden: this.orden(),
			},
		],
		queryFn: () => {
			const query: ActivosQuery = {
				page: this.pagina(),
				limit: this.limite(),
				searchTerm: this.busqueda() || undefined,
				filtro: this.filtro() || undefined,
				valorFiltro: this.opcion() || undefined,
				orden: this.orden(),
			};
			return this.repository.listar(query);
		},
		placeholderData: keepPreviousData,
	}));

	readonly activos = computed(() => this.activosQuery.data()?.data ?? []);

	readonly pagination = computed(
		() =>
			this.activosQuery.data()?.pagination ?? {
				total: 0,
				totalPages: 0,
				page: this.pagina(),
				limit: this.limite(),
			},
	);

	readonly cargando = computed(() => this.activosQuery.isPending());

	readonly errorMessage = computed(() => {
		const error = this.activosQuery.error();
		if (!error) return "";

		const httpError = error as {
			error?: { error?: string };
			message?: string;
		};
		return (
			httpError.error?.error ??
			httpError.message ??
			"Error al cargar los activos"
		);
	});

	setPagina(pagina: number): void {
		const total = Math.max(this.pagination().totalPages, 1);
		if (pagina < 1 || pagina > total) return;
		this.pagina.set(pagina);
	}

	setLimite(limite: number): void {
		this.limite.set(limite);
		this.pagina.set(1);
	}

	setBusqueda(termino: string): void {
		this.busqueda.set(termino);
		this.pagina.set(1);
	}

	setFiltro(filtro: string): void {
		this.filtro.set(filtro);
		this.opcion.set("");
		this.pagina.set(1);
	}

	setOpcion(opcion: string): void {
		this.opcion.set(opcion);
		this.pagina.set(1);
	}

	setOrden(orden: string): void {
		this.orden.set(orden);
	}

	/** Aplica un filtro que viene desde query params (notificaciones). */
	aplicarFiltroInicial(filtro: string, opcion: string): void {
		const estados: Record<string, string> = {
			disponible: "Disponible",
			asignado: "Asignado",
			mantenimiento: "En mantenimiento",
		};

		this.filtro.set(filtro);
		this.opcion.set(
			filtro === "estado" ? (estados[opcion.toLowerCase()] ?? opcion) : opcion,
		);
		this.pagina.set(1);
	}

	limpiar(): void {
		this.busqueda.set("");
		this.filtro.set("");
		this.opcion.set("");
		this.orden.set("asc");
		this.pagina.set(1);
	}

	recargar(): Promise<unknown> {
		return this.activosQuery.refetch();
	}
}
