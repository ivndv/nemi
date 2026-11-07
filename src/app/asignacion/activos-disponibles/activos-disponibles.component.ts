import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	OnDestroy,
	signal,
	ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom } from "rxjs";
import { CatalogosFacade } from "../../core/catalogos/catalogos.facade";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { AuthService } from "../../login/services/auth.service";
import { ActivoDisponibleResponse } from "../../models/activo.interface";
import type { SelectItem } from "../../models/datos-auxiliares.interface";
import { ActivosDisponiblesService } from "../services/activos-disponibles.service";

const EMPTY_ITEMS: SelectItem[] = [];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-activos-disponibles",
	standalone: false,
	templateUrl: "./activos-disponibles.component.html",
	styleUrl: "./activos-disponibles.component.css",
})
export class ActivosDisponiblesComponent implements OnDestroy {
	filtroSeleccionado = "";
	opcionSeleccionada = "";
	ordenSeleccionado = "asc";
	paginaActual = 1;
	limitePorPagina = 10;
	terminoBusqueda = "";
	private readonly activosDisponiblesServices = inject(
		ActivosDisponiblesService,
	);
	private readonly catalogosFacade = inject(CatalogosFacade);
	private readonly router = inject(Router);
	private readonly authService = inject(AuthService);
	private readonly refresco = signal(0);
	private searchTimer: ReturnType<typeof setTimeout> | null = null;

	private readonly query = injectQuery(() => ({
		queryKey: [
			"asignaciones",
			"disponibles",
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				search: this.terminoBusqueda,
				filtro: this.filtroSeleccionado,
				opcion: this.opcionSeleccionada,
				orden: this.ordenSeleccionado,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.activosDisponiblesServices.getActivosDisponibles(
					this.paginaActual,
					this.limitePorPagina,
					this.terminoBusqueda,
					this.filtroSeleccionado,
					this.opcionSeleccionada,
					this.ordenSeleccionado,
				),
			),
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get activosDisponibles(): ActivoDisponibleResponse[] {
		return this.query.data()?.data ?? [];
	}

	get pagination() {
		return (
			this.query.data()?.pagination ?? {
				total: 0,
				totalPages: 0,
				page: this.paginaActual,
				limit: this.limitePorPagina,
			}
		);
	}

	get errorMessage(): string {
		return getHttpErrorMessage(
			this.query.error(),
			"Error al obtener los activos disponibles",
		);
	}

	@ViewChild("searchInput") private searchInput?: ElementRef<HTMLInputElement>;

	get opcionesFiltro(): SelectItem[] {
		const data = this.catalogosFacade.catalogos();
		if (!data) return EMPTY_ITEMS;

		switch (this.filtroSeleccionado) {
			case "tipo":
				return data.tiposActivos ?? EMPTY_ITEMS;
			case "proveedor":
				return data.proveedores ?? EMPTY_ITEMS;
			case "ubicacion":
				return data.ubicaciones ?? EMPTY_ITEMS;
			default:
				return EMPTY_ITEMS;
		}
	}

	cargarActivosDisponibles(): void {
		this.refresco.update((valor) => valor + 1);
	}

	// Cambiar de página
	cambiarPagina(pagina: number): void {
		if (pagina >= 1 && pagina <= this.pagination.totalPages) {
			this.paginaActual = pagina;
			this.cargarActivosDisponibles();
		}
	}

	//Limpia los filtros aplicados y recarga los activos disponibles
	limpiarFiltros(): void {
		this.terminoBusqueda = "";
		this.filtroSeleccionado = "";
		this.opcionSeleccionada = "";
		this.ordenSeleccionado = "asc";
		this.paginaActual = 1;

		if (this.searchInput) this.searchInput.nativeElement.value = "";

		this.cargarActivosDisponibles();
	}
	/**
	 * Maneja el cambio en el selector de límite por página.
	 * @param event Evento de cambio en el selector.
	 */
	onLimitChange(event: Event): void {
		const selectElement = event.target as HTMLSelectElement; // Obtiene el valor seleccionado
		this.cambiarLimitePorPagina(selectElement.value); // Actualiza el límite por página
	}

	/**
	 * Cambia el límite de activos por página.
	 * @param limite Nuevo límite por página.
	 */
	cambiarLimitePorPagina(limite: string): void {
		this.limitePorPagina = parseInt(limite, 10); // Convierte el límite a número
		this.paginaActual = 1; // Resetea a la primera página
		this.cargarActivosDisponibles();
	}

	// Calcular el rango de activos mostrados
	get primerActivoMostrado(): number {
		return (this.paginaActual - 1) * this.limitePorPagina + 1;
	}

	/**
	 * Calcula el último activo mostrado en la tabla.
	 */
	get ultimoActivoMostrado(): number {
		return Math.min(
			this.paginaActual * this.limitePorPagina,
			this.pagination.total,
		);
	}

	/**
	 * Genera un array de páginas visibles para la paginación.
	 */
	get paginasVisibles(): number[] {
		const totalPaginas = this.pagination.totalPages;
		const rango = 5; // Máximo de páginas visibles
		let inicio = Math.max(1, this.paginaActual - Math.floor(rango / 2));
		const fin = Math.min(totalPaginas, inicio + rango - 1);

		if (fin - inicio + 1 < rango) {
			inicio = Math.max(1, fin - rango + 1);
		}

		return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i); // Genera un array de páginas visibles
	}

	// Función para dividir el texto en partes (para resaltar coincidencias)
	dividirTexto(texto: string): string[] {
		if (!this.terminoBusqueda || !texto) return [texto]; // Si no hay término de búsqueda o texto, devuelve el texto completo
		const regex = new RegExp(`(${this.terminoBusqueda})`, "gi");
		return texto.split(regex).filter(Boolean); // Divide el texto usando el término de búsqueda
	}

	// Función para verificar si una parte del texto debe ser resaltada
	esParteResaltada(parte: string): boolean {
		if (!this.terminoBusqueda) {
			return false; // Si no hay término de búsqueda, no resalta nada
		}

		// Verifica si la parte coincide con el término de búsqueda (sin importar mayúsculas/minúsculas)
		const regex = new RegExp(this.terminoBusqueda, "i");
		return regex.test(parte);
	}

	// Función para manejar el evento de asignación/detalles
	asignar(id: number): void {
		// Navegar a la página de detalles del activo
		this.router.navigate(["/asignaciones/asignar", id]);
	}

	onSearchInput(event: Event): void {
		this.terminoBusqueda = (event.target as HTMLInputElement).value;
		this.paginaActual = 1;
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => this.cargarActivosDisponibles(), 500);
	}

	/**
	 * Carga las opciones dinámicas según el filtro seleccionado
	 * @param event Evento del select de filtro
	 */
	cargarOpcionesFiltro(event: Event): void {
		this.filtroSeleccionado = (event.target as HTMLSelectElement).value;
		this.opcionSeleccionada = "";
		this.paginaActual = 1;
		this.cargarActivosDisponibles();
	}

	aplicarFiltro(event: Event): void {
		this.opcionSeleccionada = (event.target as HTMLSelectElement).value;
		this.paginaActual = 1;
		this.cargarActivosDisponibles();
	}

	aplicarOrden(event: Event): void {
		this.ordenSeleccionado = (event.target as HTMLSelectElement).value;
		this.cargarActivosDisponibles();
	}
	isAdmin(): boolean {
		return this.authService.isAdmin();
	}

	puedeOperar(): boolean {
		return this.authService.puedeOperar();
	}

	getAssetPhoto(fotoUrl: string): string {
		return fotoUrl || "";
	}

	trackById(_index: number, item: ActivoDisponibleResponse): number {
		return item.id;
	}

	trackByIndex(index: number): number {
		return index;
	}

	ngOnDestroy(): void {
		if (this.searchTimer) clearTimeout(this.searchTimer);
	}
}
