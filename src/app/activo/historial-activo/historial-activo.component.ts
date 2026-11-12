import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	inject,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom, Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { getHttpErrorMessage } from "../../core/http/http-error";
import { AuthService } from "../../login/services/auth.service";
import {
	DatosAuxiliares,
	SelectItem,
} from "../../models/datos-auxiliares.interface";
import { HistorialEntry } from "../../models/historial.interface";
import { HistorialService } from "../service/historial.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-historial-activo",
	standalone: false,
	templateUrl: "./historial-activo.component.html",
	styleUrl: "./historial-activo.component.css",
})
export class HistorialActivoComponent implements OnInit, OnDestroy {
	filtroSeleccionado: string = "";
	opcionSeleccionada: string = "";
	ordenSeleccionado: string = "asc";

	readonly activoId = signal(0);
	paginaActual = 1;
	limitePorPagina = 10;

	searchTerm = "";
	datosAuxiliares: DatosAuxiliares["data"] | null = null;

	private readonly route = inject(ActivatedRoute);
	private readonly historialService = inject(HistorialService);
	private readonly authService = inject(AuthService);
	private readonly cdr = inject(ChangeDetectorRef);
	private readonly refresco = signal(0);
	private readonly destroy$ = new Subject<void>();
	private searchTimer: ReturnType<typeof setTimeout> | null = null;

	private readonly query = injectQuery(() => ({
		queryKey: [
			"historial",
			this.activoId(),
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				search: this.searchTerm,
				filtro: this.filtroSeleccionado,
				opcion: this.opcionSeleccionada,
				orden: this.ordenSeleccionado,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.historialService.getHistorial(
					this.activoId(),
					this.paginaActual,
					this.limitePorPagina,
					this.searchTerm,
					this.filtroSeleccionado,
					this.opcionSeleccionada,
					this.ordenSeleccionado,
				),
			),
		enabled: this.activoId() > 0,
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get historial(): HistorialEntry[] {
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
			"Error al obtener historial",
		);
	}

	@ViewChild("searchInput") private searchInput?: ElementRef<HTMLInputElement>;

	get opcionesFiltro(): SelectItem[] {
		if (this.filtroSeleccionado === "accion") {
			return this.datosAuxiliares?.acciones ?? [];
		}
		if (this.filtroSeleccionado === "usuario_responsable") {
			return this.datosAuxiliares?.usuarios ?? [];
		}
		return [];
	}

	// Helper para determinar la clase del badge según la acción o su slug
	getBadgeClass(valor: string): string {
		const a = valor.toLowerCase();

		if (a.includes("baja") || a.includes("eliminad")) return "badge-unassign";
		if (a.includes("devuelt") || a.includes("desasignad"))
			return "badge-unassign";
		if (a.includes("asignad")) return "badge-assign";
		if (a.includes("creado") || a.includes("nuevo")) return "badge-create";
		if (a.includes("actualizad") || a.includes("editad")) return "badge-update";
		if (a.includes("mantenimiento")) return "badge-update";
		if (a.includes("licencia") || a.includes("solicitud"))
			return "badge-create";
		if (a.includes("incidencia") || a.includes("garantia"))
			return "badge-default";

		return "badge-default";
	}

	// Helper para determinar el icono según la acción o su slug
	getBadgeIcon(valor: string): string {
		const a = valor.toLowerCase();

		if (a.includes("baja")) return "lucide:trash-2";
		if (a.includes("devuelt") || a.includes("desasignad"))
			return "lucide:user-minus";
		if (a.includes("asignad")) return "lucide:user-plus";
		if (a.includes("creado")) return "lucide:plus-circle";
		if (a.includes("actualizad")) return "lucide:edit-3";
		if (a.includes("mantenimiento")) return "lucide:wrench";
		if (a.includes("licencia")) return "lucide:key-round";
		if (a.includes("solicitud")) return "lucide:clipboard-list";
		if (a.includes("incidencia")) return "lucide:alert-triangle";
		if (a.includes("garantia")) return "lucide:shield-check";

		return "lucide:info";
	}

	ngOnInit(): void {
		this.activoId.set(Number(this.route.snapshot.paramMap.get("id") ?? 0));

		// Los filtros auxiliares solo están disponibles para roles operativos
		if (!this.authService.isEmpleado()) {
			this.cargarDatosAuxiliares();
		}
	}

	cargarHistorial(): void {
		this.refresco.update((valor) => valor + 1);
	}

	/**
	 * Carga los datos auxiliares necesarios para el componente.
	 */
	cargarDatosAuxiliares(): void {
		this.historialService
			.obtenerDatosAuxiliares()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.datosAuxiliares = response.data;
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener datos auxiliares" }
					const errorMessage =
						error.error?.error || "Error al obtener datos auxiliares";

					// Mostrar el mensaje
					console.error("Error del backend:", errorMessage);
					Swal.fire({
						icon: "error",
						text: errorMessage,
						confirmButtonColor: "#1e293b",
					});
				},
			});
	}

	/**
	 * Cambia el límite de activos por página.
	 * @param limite Nuevo límite por página.
	 */
	cambiarLimitePorPagina(limite: string): void {
		this.limitePorPagina = parseInt(limite, 10); // Convierte el límite a número
		this.paginaActual = 1; // Resetea a la primera página
		this.cargarHistorial(); // Recarga los datos con el nuevo límite
	}

	/**
	 * Cambia la página actual.
	 * @param pagina Número de página a mostrar.
	 */
	cambiarPagina(pagina: number): void {
		if (pagina >= 1 && pagina <= this.pagination.totalPages) {
			this.paginaActual = pagina; // Actualiza la página actual
			this.cargarHistorial(); // Recarga los datos para la nueva página
		}
	}

	/**
	 * Calcula el primer activo mostrado en la tabla.
	 */
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

	/**
	 * Maneja el cambio en el selector de límite por página.
	 * @param event Evento de cambio en el selector.
	 */
	onLimitChange(event: Event): void {
		const selectElement = event.target as HTMLSelectElement; // Obtiene el valor seleccionado
		this.cambiarLimitePorPagina(selectElement.value); // Actualiza el límite por página
	}

	onSearchInput(event: Event): void {
		this.searchTerm = (event.target as HTMLInputElement).value;
		this.paginaActual = 1;
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => this.cargarHistorial(), 500);
	}

	/**
	 * Divide el texto en partes resaltadas y no resaltadas.
	 * @param texto Texto a dividir.
	 * @returns Array de strings con las partes resaltadas y no resaltadas.
	 */
	dividirTexto(texto: string): string[] {
		if (!this.searchTerm || !texto) return [texto]; // Si no hay término de búsqueda o texto, devuelve el texto completo
		const regex = new RegExp(`(${this.searchTerm})`, "gi");
		return texto.split(regex).filter(Boolean); // Divide el texto usando el término de búsqueda
	}
	/**
	 * Verifica si una palabra debe ser resaltada.
	 * @param palabra Palabra a verificar.
	 * @returns `true` si la palabra coincide con el término de búsqueda, `false` en caso contrario.
	 */
	esParteResaltada(palabra: string): boolean {
		if (!this.searchTerm) return false; // Si no hay término de búsqueda, no hay nada que resaltar
		const regex = new RegExp(`^${this.searchTerm}$`, "i");
		return regex.test(palabra); // Compara la palabra con el término de búsqueda
	}

	/**
	 * Carga las opciones dinámicas según el filtro seleccionado
	 * @param event Evento del select de filtro
	 */
	cargarOpcionesFiltro(event: Event): void {
		this.filtroSeleccionado = (event.target as HTMLSelectElement).value;
		this.opcionSeleccionada = "";
		this.paginaActual = 1;
		this.cargarHistorial();
	}
	/**
	 * Limpia los filtros aplicados y recarga los activos
	 */

	limpiarFiltros(): void {
		this.searchTerm = "";
		this.filtroSeleccionado = "";
		this.opcionSeleccionada = "";
		this.ordenSeleccionado = "asc";
		this.paginaActual = 1;

		if (this.searchInput) this.searchInput.nativeElement.value = "";
		this.cargarHistorial();
	}
	/**
	 * Aplica el filtro seleccionado y recarga los activos
	 * @param event Evento del select de filtro
	 */
	aplicarFiltro(event: Event): void {
		this.opcionSeleccionada = (event.target as HTMLSelectElement).value;
		this.paginaActual = 1;
		this.cargarHistorial();
	}

	/**
	 * Aplica el orden seleccionado y recarga los activos
	 * @param event Evento del select de orden
	 */
	aplicarOrden(event: Event): void {
		this.ordenSeleccionado = (event.target as HTMLSelectElement).value;
		this.cargarHistorial();
	}

	trackById(_index: number, item: HistorialEntry): number {
		return item.id;
	}

	trackByIndex(index: number): number {
		return index;
	}

	ngOnDestroy(): void {
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.destroy$.next();
		this.destroy$.complete();
	}
}
