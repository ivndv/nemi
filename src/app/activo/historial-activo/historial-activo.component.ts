import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import Swal from "sweetalert2";
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

	activoId!: number;
	historial: HistorialEntry[] = [];

	pagination: {
		total: number;
		totalPages: number;
		page: number;
		limit: number;
	} = { total: 0, totalPages: 0, page: 1, limit: 10 };
	paginaActual: number = 1;
	limitePorPagina: number = 10;

	searchTerm: string = "";

	errorMessage: string = "";

	private searchSubject = new Subject<string>();
	private destroy$ = new Subject<void>();

	datosAuxiliares: DatosAuxiliares["data"] | null = null;

	constructor(
		private route: ActivatedRoute,
		private historialService: HistorialService,
		private cdr: ChangeDetectorRef,
	) {}

	// Helper para determinar la clase del badge según la acción
	getBadgeClass(accion: string): string {
		const a = accion.toLowerCase();
		if (a.includes("asignado") && !a.includes("desasignado"))
			return "badge-assign";
		if (a.includes("desasignado") || a.includes("baja"))
			return "badge-unassign";
		if (a.includes("creado") || a.includes("nuevo")) return "badge-create";
		if (a.includes("actualizado") || a.includes("editado"))
			return "badge-update";
		return "badge-default";
	}

	// Helper para determinar el icono según la acción
	getBadgeIcon(accion: string): string {
		const a = accion.toLowerCase();
		if (a.includes("asignado") && !a.includes("desasignado"))
			return "lucide:user-plus";
		if (a.includes("desasignado")) return "lucide:user-minus";
		if (a.includes("baja")) return "lucide:trash-2";
		if (a.includes("creado")) return "lucide:plus-circle";
		if (a.includes("actualizado")) return "lucide:edit-3";
		return "lucide:info";
	}

	ngOnInit(): void {
		// Obtener el ID del activo desde la ruta
		this.activoId = +(this.route.snapshot.paramMap.get("id") || 0);
		// Cargar el historial al inicializar el componente
		this.cargarHistorial();

		// Cargar datos auxiliares al inicializar el componente
		this.cargarDatosAuxiliares();

		// Configuración del debounce para la barra de búsqueda
		this.searchSubject
			.pipe(
				debounceTime(500), // Espera 500ms después del último cambio en la barra de búsqueda
				switchMap((term) => {
					console.log("Término enviado al backend:", term);
					this.searchTerm = term;
					this.paginaActual = 1;
					console.group("Cargando Historial");
					console.log("parametros actuales", {
						activoId: this.activoId,
						paginaActual: this.paginaActual,
						limitePorPagina: this.limitePorPagina,
						searchTerm: this.searchTerm,
					});
					return this.historialService.getHistorial(
						this.activoId,
						this.paginaActual,
						this.limitePorPagina,
						this.searchTerm,
					);
				}),
				takeUntil(this.destroy$),
			)
			.subscribe({
				next: (response) => {
					console.log("Respuesta del backend recibida:", response);
					this.historial = response.data; // Actualiza la lista de activos
					this.pagination = response.pagination; // Actualiza la paginación
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener historial" }
					const errorMessage =
						error.error?.error || "Error al obtener historial";

					// Mostrar el mensaje
					this.errorMessage = errorMessage;
					console.error("Error del backend:", errorMessage);
					Swal.fire({
						icon: "error",
						text: errorMessage,
						confirmButtonColor: "#1e293b",
					});
				},
			});
	}

	// Método para cargar el historial con paginación
	cargarHistorial(): void {
		console.group("Cargando Historial");
		console.log("parametros actuales", {
			activoId: this.activoId,
			paginaActual: this.paginaActual,
			limitePorPagina: this.limitePorPagina,
			searchTerm: this.searchTerm,
			filtro: this.filtroSeleccionado,
			opción: this.opcionSeleccionada,
			orden: this.ordenSeleccionado,
		});
		this.historialService
			.getHistorial(
				this.activoId,
				this.paginaActual,
				this.limitePorPagina,
				this.searchTerm,
				this.filtroSeleccionado,
				this.opcionSeleccionada,
				this.ordenSeleccionado,
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log("Respuesta del backend:", response);
					this.historial = response.data;
					this.pagination = response.pagination;
					this.cdr.markForCheck();
					console.log("Historial cargado:", this.historial);
					console.groupEnd();
				},
				error: (error) => {
					const errorMessage =
						error.error?.error || "Error al obtener historial";
					this.errorMessage = errorMessage;
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
	 * Carga los datos auxiliares necesarios para el componente.
	 */
	cargarDatosAuxiliares(): void {
		this.historialService
			.obtenerDatosAuxiliares()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log("Datos auxiliares cargados:", response);
					this.datosAuxiliares = response.data;
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener datos auxiliares" }
					const errorMessage =
						error.error?.error || "Error al obtener datos auxiliares";

					// Mostrar el mensaje
					this.errorMessage = errorMessage;
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

	// Maneja el cambio en la barra de búsqueda
	onSearchInput(event: Event): void {
		const inputElement = event.target as HTMLInputElement; // Casting seguro
		this.searchTerm = inputElement.value; // Obtiene el valor
		this.onSearchChange(inputElement.value); // Llama a la función de búsqueda
	}
	// Maneja el cambio en la barra de búsqueda
	onSearchChange(term: string): void {
		this.searchTerm = term;
		this.paginaActual = 1;
		this.searchSubject.next(term);
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
		this.filtroSeleccionado = (event.target as HTMLSelectElement).value; // Guarda el tipo de filtro
		console.log(
			"[FILTRO] Tipo de filtro seleccionado:",
			this.filtroSeleccionado,
		);

		const opcionesSelect = document.getElementById(
			"opciones",
		) as HTMLSelectElement;

		// Limpiar opciones existentes
		while (opcionesSelect.options.length > 1) {
			opcionesSelect.remove(1);
		}

		let opciones: SelectItem[] = [];

		switch (
			this.filtroSeleccionado // Usamos la variable guardada
		) {
			case "accion":
				opciones = this.datosAuxiliares?.acciones || [];
				break;
			case "usuario_responsable":
				opciones = this.datosAuxiliares?.usuarios || [];
				break;
			default:
				return;
		}

		console.log("[FILTRO] Opciones cargadas:", opciones);
		opciones.forEach((opcion) => {
			const optionElement = document.createElement("option");
			optionElement.value = String(opcion.id || opcion.nombre);
			optionElement.textContent = opcion.nombre || opcion.descripcion || null;
			opcionesSelect.appendChild(optionElement);
		});
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

		// Resetear controles del formulario
		const searchInput = document.querySelector(
			'input[type="text"]',
		) as HTMLInputElement;
		if (searchInput) searchInput.value = "";

		const filtroSelect = document.getElementById("filtro") as HTMLSelectElement;
		if (filtroSelect) filtroSelect.value = "";

		const opcionesSelect = document.getElementById(
			"opciones",
		) as HTMLSelectElement;
		if (opcionesSelect) opcionesSelect.value = "";

		this.cargarHistorial();
	}

	/**
	 * Aplica el filtro seleccionado y recarga los activos
	 * @param event Evento del select de filtro
	 */
	aplicarFiltro(event: Event): void {
		this.opcionSeleccionada = (event.target as HTMLSelectElement).value;
		console.log("[FILTRO] Aplicando filtro:", {
			tipo: this.filtroSeleccionado,
			valor: this.opcionSeleccionada,
		});
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
		this.destroy$.next();
		this.destroy$.complete();
	}
}
