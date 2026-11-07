import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	effect,
	inject,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { AuthService } from "../../login/services/auth.service";
import { ActivoListItem } from "../../models/activo.interface";
import { ActivosFacade } from "../application/activos.facade";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-activos",
	standalone: false,
	templateUrl: "./lista-activos.component.html",
	styleUrl: "./lista-activos.component.css",
})
export class ListaActivosComponent implements OnInit, OnDestroy {
	private readonly facade = inject(ActivosFacade);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	private readonly authService = inject(AuthService);

	readonly searchTerm = signal("");
	@ViewChild("searchInput") private searchInput?: ElementRef<HTMLInputElement>;

	private readonly destroy$ = new Subject<void>();
	private searchTimer: ReturnType<typeof setTimeout> | null = null;
	private lastError = "";

	constructor() {
		effect(() => {
			const message = this.facade.errorMessage();
			if (!message || message === this.lastError) return;

			this.lastError = message;
			Swal.fire({
				title: "Error",
				text: message,
				icon: "error",
				buttonsStyling: false,
				customClass: {
					popup: "premium-swal-popup",
					title: "premium-swal-title",
					htmlContainer: "premium-swal-html",
					confirmButton: "premium-swal-confirm",
				},
			});
		});
	}

	ngOnInit(): void {
		this.route.queryParams
			.pipe(takeUntil(this.destroy$))
			.subscribe((params) => {
				if (params["licencia_proxima"]) {
					this.facade.aplicarFiltroInicial("licencia_proxima", "true");
				} else if (params["garantia_proxima"]) {
					this.facade.aplicarFiltroInicial("garantia_proxima", "true");
				} else if (params["estado"]) {
					this.facade.aplicarFiltroInicial("estado", params["estado"]);
				} else if (params["fecha_devolucion_proxima"]) {
					this.facade.aplicarFiltroInicial("fecha_devolucion_proxima", "true");
				}

				if (params["orden"]) {
					this.facade.setOrden(params["orden"]);
				}
			});
	}

	// Señales expuestas a la plantilla
	get activos(): ActivoListItem[] {
		return this.facade.activos();
	}

	get pagination() {
		return this.facade.pagination();
	}

	get paginaActual(): number {
		return this.facade.pagina();
	}

	get limitePorPagina(): number {
		return this.facade.limite();
	}

	get filtroSeleccionado(): string {
		return this.facade.filtro();
	}

	get opcionSeleccionada(): string {
		return this.facade.opcion();
	}

	get ordenSeleccionado(): string {
		return this.facade.orden();
	}

	get opcionesFiltro() {
		return this.facade.opcionesFiltro();
	}

	get cargando(): boolean {
		return this.facade.cargando();
	}

	onSearchInput(event: Event): void {
		const term = (event.target as HTMLInputElement).value;
		this.searchTerm.set(term);

		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => {
			this.facade.setBusqueda(term);
		}, 350);
	}

	onSearchChange(term: string): void {
		this.facade.setBusqueda(term);
	}

	cambiarLimitePorPagina(limite: string): void {
		this.facade.setLimite(Number.parseInt(limite, 10));
	}

	cambiarPagina(pagina: number): void {
		this.facade.setPagina(pagina);
	}

	get primerActivoMostrado(): number {
		return (this.paginaActual - 1) * this.limitePorPagina + 1;
	}

	get ultimoActivoMostrado(): number {
		return Math.min(
			this.paginaActual * this.limitePorPagina,
			this.pagination.total,
		);
	}

	get paginasVisibles(): number[] {
		const totalPaginas = this.pagination.totalPages;
		const rango = 5;
		let inicio = Math.max(1, this.paginaActual - Math.floor(rango / 2));
		const fin = Math.min(totalPaginas, inicio + rango - 1);

		if (fin - inicio + 1 < rango) {
			inicio = Math.max(1, fin - rango + 1);
		}

		return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
	}

	onLimitChange(event: Event): void {
		this.cambiarLimitePorPagina((event.target as HTMLSelectElement).value);
	}

	cargarOpcionesFiltro(event: Event): void {
		this.facade.setFiltro((event.target as HTMLSelectElement).value);
	}

	aplicarFiltro(event: Event): void {
		this.facade.setOpcion((event.target as HTMLSelectElement).value);
	}

	aplicarOrden(event: Event): void {
		this.facade.setOrden((event.target as HTMLSelectElement).value);
	}

	limpiarFiltros(): void {
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.searchTerm.set("");
		if (this.searchInput) this.searchInput.nativeElement.value = "";
		this.facade.limpiar();
	}

	dividirTexto(texto: string): string[] {
		const term = this.searchTerm();
		if (!term || !texto) return [texto];

		const regex = new RegExp(`(${term})`, "gi");
		return texto.split(regex).filter(Boolean);
	}

	esParteResaltada(palabra: string): boolean {
		const term = this.searchTerm();
		if (!term) return false;

		const regex = new RegExp(`^${term}$`, "i");
		return regex.test(palabra);
	}

	verDetalles(id: number): void {
		this.router.navigate(["/gestion-activos/detalle", id]);
	}

	isAdmin(): boolean {
		return this.authService.isAdmin();
	}

	puedeOperar(): boolean {
		return this.authService.puedeOperar();
	}

	isEmpleado(): boolean {
		return this.authService.isEmpleado();
	}

	getAssetPhoto(fotoUrl: string): string {
		return fotoUrl || "";
	}

	ngOnDestroy(): void {
		if (this.searchTimer) clearTimeout(this.searchTimer);
		this.destroy$.next();
		this.destroy$.complete();
	}

	trackById(_index: number, item: ActivoListItem): number {
		return item.id;
	}

	trackByIndex(index: number): number {
		return index;
	}
}
