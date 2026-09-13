import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import Swal from "sweetalert2";
import { AuthService } from "../../login/services/auth.service";
import { AsignacionData } from "../../models/asignacion.interface";
import {
	DatosAuxiliares,
	SelectItem,
} from "../../models/datos-auxiliares.interface";
import { getCloudflareImage } from "../../utils/images";
import { AsignacionService } from "../services/asignacion.service";
import { AuxiliaresService } from "../services/auxiliares.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-activos-asignados",
	standalone: false,
	templateUrl: "./activos-asignados.component.html",
	styleUrl: "./activos-asignados.component.css",
})
export class ActivosAsignadosComponent implements OnInit, OnDestroy {
	filtroSeleccionado: string = "";
	opcionSeleccionada: string = "";
	ordenSeleccionado: string = "asc";
	listaAsignaciones: AsignacionData[] = [];
	pagination: {
		total: number;
		totalPages: number;
		page: number;
		limit: number;
	} = { total: 0, totalPages: 0, page: 1, limit: 10 };
	limitePorPagina: number = 10;
	paginaActual: number = 1;
	private searchSubject = new Subject<string>();
	private destroy$ = new Subject<void>();
	terminoBusqueda: string = "";
	datosAuxiliares: DatosAuxiliares["data"] | null = null;
	errorMessage: string = "";

	constructor(
		private cdr: ChangeDetectorRef,
		private asignacionService: AsignacionService,
		private enrutador: Router,
		private auxiliaresService: AuxiliaresService,
		private authService: AuthService,
	) {}

	ngOnInit(): void {
		this.cargarAsignaciones(); // Carga inicial de datos
		this.obtenerDatosAuxiliares(); // Obtener los datos auxiliares

		this.searchSubject
			.pipe(
				debounceTime(500), // Espera 500ms después del último cambio en la barra de búsqueda
				switchMap((term) => {
					console.log("Término enviado al backend:", term);
					this.terminoBusqueda = term;
					this.paginaActual = 1;
					return this.asignacionService.getAsignaciones(
						this.paginaActual,
						this.limitePorPagina,
						this.terminoBusqueda,
					);
				}),
				takeUntil(this.destroy$),
			)
			.subscribe({
				next: (response) => {
					console.log("Respuesta del backend recibida:", response);
					this.listaAsignaciones = response.data;
					this.pagination = response.pagination;
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Erro al crear activo" }
					const errorMessage =
						error.error?.error || "Erro al obtener asignaciones";

					// Mostrar el mensaje
					this.errorMessage = errorMessage;
					console.error("Error del backend:", errorMessage);
					Swal.fire({
						title: "Error",
						text: errorMessage,
						icon: "error",
						buttonsStyling: false,
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
							htmlContainer: "premium-swal-html",
							confirmButton: "premium-swal-confirm",
						},
					});
				},
			});
	}

	cargarAsignaciones(): void {
		// Logs detallados para depuración
		console.group("[CARGAR ACTIVOS DISPONIBLES]");
		console.log("Parámetros enviados al backend:", {
			paginaActual: this.paginaActual,
			limitePorPagina: this.limitePorPagina,
			terminoBusqueda: this.terminoBusqueda,
			filtroSeleccionado: this.filtroSeleccionado,
			opcionSeleccionada: this.opcionSeleccionada,
			ordenSeleccionado: this.ordenSeleccionado,
		});

		this.asignacionService
			.getAsignaciones(
				this.paginaActual,
				this.limitePorPagina,
				this.terminoBusqueda,
				this.filtroSeleccionado,
				this.opcionSeleccionada,
				this.ordenSeleccionado,
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log("Respuesta del backend recibida:", response);
					this.listaAsignaciones = response.data;
					this.pagination = response.pagination;
					this.cdr.markForCheck();
					console.groupEnd();

					// Verificar si no hay resultados
					if (response.data.length === 0) {
						console.warn("No se encontraron activos disponibles.");
					}

					console.groupEnd();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Erro al obtener asignaciones';" }
					const errorMessage =
						error.error?.error || "Erro al obtener asignaciones";

					// Mostrar el mensaje
					this.errorMessage = errorMessage;
					console.error("Error del backend:", errorMessage);
					Swal.fire({
						title: "Error",
						text: errorMessage,
						icon: "error",
						buttonsStyling: false,
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
							htmlContainer: "premium-swal-html",
							confirmButton: "premium-swal-confirm",
						},
					});
				},
			});
	}

	// Función para obtener los datos auxiliares
	obtenerDatosAuxiliares(): void {
		const idActivo = 1; // Supongamos que estamos buscando datos auxiliares para un activo con ID 1
		this.auxiliaresService
			.getDatosAuxiliares(idActivo)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log("Datos auxiliares recibidos:", response);
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
						title: "Error",
						text: errorMessage,
						icon: "error",
						buttonsStyling: false,
						customClass: {
							popup: "premium-swal-popup",
							title: "premium-swal-title",
							htmlContainer: "premium-swal-html",
							confirmButton: "premium-swal-confirm",
						},
					});
				},
			});
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

	// Función para manejar el evento de edición/detalles
	editar(id: number): void {
		// Navegar a la página de detalles del activo
		this.enrutador.navigate(["/asignaciones/editar", id]);
	}

	// Maneja el cambio en la barra de búsqueda
	onSearchInput(event: Event): void {
		const inputElement = event.target as HTMLInputElement; // Casting seguro
		this.terminoBusqueda = inputElement.value; // Obtiene el valor
		this.onSearchChange(inputElement.value);
	}

	onSearchChange(term: string): void {
		this.terminoBusqueda = term;
		this.paginaActual = 1;
		this.searchSubject.next(term);
	}

	/**
	 * Cambia el límite de activos por página.
	 * @param limite Nuevo límite por página.
	 */
	cambiarLimitePorPagina(limite: string): void {
		this.limitePorPagina = parseInt(limite, 10); // Convierte el límite a número
		this.paginaActual = 1; // Resetea a la primera página
		this.cargarAsignaciones(); // Recarga los datos con el nuevo límite
	}

	/**
	 * Cambia la página actual.
	 * @param pagina Número de página a mostrar.
	 */
	cambiarPagina(pagina: number): void {
		if (pagina >= 1 && pagina <= this.pagination.totalPages) {
			this.paginaActual = pagina; // Actualiza la página actual
			this.cargarAsignaciones(); // Recarga los datos para la nueva página
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

	limpiarFiltros(): void {
		this.terminoBusqueda = "";
		this.filtroSeleccionado = "";
		this.opcionSeleccionada = "";
		this.ordenSeleccionado = "asc";
		this.paginaActual = 1;

		const searchInput = document.getElementById(
			"busqueda2",
		) as HTMLInputElement;
		if (searchInput) searchInput.value = "";

		// Limpiar el selector de filtro
		const filtroSelect = document.getElementById(
			"filtro2",
		) as HTMLSelectElement;
		if (filtroSelect) filtroSelect.value = "";

		// Limpiar el selector de opciones
		const opcionesSelect = document.getElementById(
			"opciones2",
		) as HTMLSelectElement;
		if (opcionesSelect) {
			opcionesSelect.value = ""; // Resetea el valor seleccionado
			while (opcionesSelect.options.length > 1) {
				opcionesSelect.remove(1); // Elimina todas las opciones dinámicas excepto la primera
			}
		}

		// Recargar los datos sin filtros
		this.cargarAsignaciones();
	}

	cargarOpcionesFiltro(_event: Event): void {
		const filtroSelect = document.getElementById(
			"filtro2",
		) as HTMLSelectElement;
		this.filtroSeleccionado = filtroSelect.value; // Guarda el tipo de filtro

		const opcionesSelect = document.getElementById(
			"opciones2",
		) as HTMLSelectElement;

		// Limpiar opciones existentes
		while (opcionesSelect.options.length > 1) {
			opcionesSelect.remove(1);
		}

		let opciones: SelectItem[] = [];

		switch (this.filtroSeleccionado) {
			case "tipo":
				opciones = this.datosAuxiliares?.tiposActivos || [];
				break;
			case "proveedor":
				opciones = this.datosAuxiliares?.proveedores || [];
				break;
			case "ubicacion":
				opciones = this.datosAuxiliares?.ubicaciones || [];
				break;
			case "usuario_asignado":
				opciones = this.datosAuxiliares?.usuarios || [];
				break;
			default:
				return;
		}

		console.log("[FILTRO] Opciones cargadas:", opciones);
		opciones.forEach((opcion) => {
			const optionElement = document.createElement("option");
			optionElement.value = String(opcion.id);
			optionElement.textContent = opcion.nombre || opcion.descripcion || null;
			opcionesSelect.appendChild(optionElement);
		});
	}

	aplicarFiltro(_event: Event): void {
		const opcionesSelect = document.getElementById(
			"opciones2",
		) as HTMLSelectElement;

		// Verificar que el elemento exista
		if (opcionesSelect) {
			this.opcionSeleccionada = opcionesSelect.value; // Obtener el valor seleccionado
			console.log("[FILTRO] Aplicando filtro:", {
				tipo: this.filtroSeleccionado, // Tipo de filtro seleccionado
				valor: this.opcionSeleccionada, // Valor seleccionado en el filtro
			});

			this.paginaActual = 1; // Resetea a la primera página
			this.cargarAsignaciones(); // Recarga los datos con el filtro aplicado
		} else {
			console.error('[ERROR] No se encontró el elemento con ID "opciones2".');
		}
	}

	aplicarOrden(_event: Event): void {
		const ordenSelect = document.getElementById(
			"direccion2",
		) as HTMLSelectElement;

		// Verificar que el elemento exista
		if (ordenSelect) {
			this.ordenSeleccionado = ordenSelect.value; // Obtener el valor seleccionado
			console.log("[ORDEN] Orden seleccionado:", this.ordenSeleccionado);

			this.cargarAsignaciones(); // Recarga los datos con el nuevo orden
		} else {
			console.error('[ERROR] No se encontró el elemento con ID "orden2".');
		}
	}

	isAdmin(): boolean {
		return this.authService.isAdmin();
	}

	getAssetPhoto(fotoUrl: string): string {
		return getCloudflareImage(fotoUrl, { width: 150 });
	}

	trackById(_index: number, item: AsignacionData): number {
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
