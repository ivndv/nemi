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
import { ActivoDisponibleResponse } from "../../models/activo.interface";
import {
	DatosAuxiliares,
	SelectItem,
} from "../../models/datos-auxiliares.interface";
import { getCloudflareImage } from "../../utils/images";
import { ActivosDisponiblesService } from "../services/activos-disponibles.service";
import { AuxiliaresService } from "../services/auxiliares.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-activos-disponibles",
	standalone: false,
	templateUrl: "./activos-disponibles.component.html",
	styleUrl: "./activos-disponibles.component.css",
})
export class ActivosDisponiblesComponent implements OnInit, OnDestroy {
	filtroSeleccionado: string = "";
	opcionSeleccionada: string = "";
	ordenSeleccionado: string = "asc";

	activosDisponibles: ActivoDisponibleResponse[] = [];
	pagination: {
		total: number;
		totalPages: number;
		page: number;
		limit: number;
	} = { total: 0, totalPages: 0, page: 1, limit: 10 };
	paginaActual: number = 1;
	limitePorPagina: number = 10;
	private searchSubject = new Subject<string>();
	private destroy$ = new Subject<void>();
	terminoBusqueda: string = "";
	datosAuxiliares: DatosAuxiliares["data"] | null = null;
	errorMessage: string = "";

	constructor(
		private cdr: ChangeDetectorRef,
		private activosDisponiblesServices: ActivosDisponiblesService,
		private auxiliaresService: AuxiliaresService,
		private router: Router,
		private authService: AuthService,
	) {}

	ngOnInit(): void {
		this.cargarActivosDisponibles(); // Cargar los activos al inicializar el componente
		this.obtenerDatosAuxiliares(); // Obtener los datos auxiliares

		this.searchSubject
			.pipe(
				debounceTime(500), // Espera 500ms después del último cambio en la barra de búsqueda
				switchMap((term) => {
					console.log("Término enviado al backend:", term);
					this.terminoBusqueda = term;
					this.paginaActual = 1;
					return this.activosDisponiblesServices.getActivosDisponibles(
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
					this.activosDisponibles = response.data;
					this.pagination = response.pagination;
					console.log("Activos disponibles xd:", this.activosDisponibles);
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener los activos disponibles" }
					const errorMessage =
						error.error?.error || "Error al obtener los activos disponibles";
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

	cargarActivosDisponibles(): void {
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

		// Llamada al servicio para obtener los activos disponibles
		this.activosDisponiblesServices
			.getActivosDisponibles(
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
					this.activosDisponibles = response.data;
					this.pagination = response.pagination;
					this.cdr.markForCheck();
					console.groupEnd();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener los activos disponibles" }
					const errorMessage =
						error.error?.error || "Error al obtener los activos disponibles";
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
					this.datosAuxiliares = response.data; // Almacena los datos auxiliares
					this.cdr.markForCheck();
				},
				error: (error) => {
					// Ejem. Si el backend devuelve { error: "Error al obtener los datos auxiliares" }
					const errorMessage =
						error.error?.error || "Error al obtener los datos auxiliares";
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

		const searchInput = document.getElementById("busqueda") as HTMLInputElement;
		if (searchInput) searchInput.value = "";

		// Limpiar el selector de filtro
		const filtroSelect = document.getElementById("filtro") as HTMLSelectElement;
		if (filtroSelect) filtroSelect.value = "";

		// Limpiar el selector de opciones
		const opcionesSelect = document.getElementById(
			"opciones",
		) as HTMLSelectElement;
		if (opcionesSelect) {
			opcionesSelect.value = "";
			while (opcionesSelect.options.length > 1) {
				opcionesSelect.remove(1); // Elimina todas las opciones dinámicas excepto la primera
			}
		}

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
	 * Carga las opciones dinámicas según el filtro seleccionado
	 * @param event Evento del select de filtro
	 */
	cargarOpcionesFiltro(_event: Event): void {
		const filtroSelect = document.getElementById("filtro") as HTMLSelectElement;
		this.filtroSeleccionado = filtroSelect.value; // Guarda el tipo de filtro

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
			case "tipo":
				opciones = this.datosAuxiliares?.tiposActivos || [];
				break;
			case "proveedor":
				opciones = this.datosAuxiliares?.proveedores || [];
				break;
			case "ubicacion":
				opciones = this.datosAuxiliares?.ubicaciones || [];
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
		// Seleccionar el elemento por su ID
		const opcionesSelect = document.getElementById(
			"opciones",
		) as HTMLSelectElement;

		// Verificar que el elemento exista
		if (opcionesSelect) {
			this.opcionSeleccionada = opcionesSelect.value; // Obtener el valor seleccionado
			console.log("[FILTRO] Aplicando filtro:", {
				tipo: this.filtroSeleccionado, // Tipo de filtro seleccionado
				valor: this.opcionSeleccionada, // Valor seleccionado en el filtro
			});

			this.paginaActual = 1; // Resetea a la primera página
			this.cargarActivosDisponibles(); // Recarga los datos con el filtro aplicado
		} else {
			console.error('[ERROR] No se encontró el elemento con ID "opciones2".');
		}
	}

	aplicarOrden(_event: Event): void {
		const ordenSelect = document.getElementById(
			"direccion",
		) as HTMLSelectElement;

		// Verificar que el elemento exista
		if (ordenSelect) {
			this.ordenSeleccionado = ordenSelect.value; // Obtener el valor seleccionado
			console.log("[ORDEN] Orden seleccionado:", this.ordenSeleccionado);

			this.cargarActivosDisponibles(); // Recarga los datos con el nuevo orden
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

	trackById(_index: number, item: ActivoDisponibleResponse): number {
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
