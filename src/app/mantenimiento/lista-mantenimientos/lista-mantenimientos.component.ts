import { Dialog } from "@angular/cdk/dialog";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import {
	injectQuery,
	keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { firstValueFrom, Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { ActivoService } from "../../activo/service/activo.service";
import { DatosService } from "../../activo/service/datos.service";
import { getHttpErrorMessage } from "../../core/http/http-error";
import type { ActivoListItem } from "../../models/activo.interface";
import type {
	CerrarMantenimientoPayload,
	CrearMantenimientoPayload,
	MantenimientoItem,
} from "../../models/mantenimiento.interface";
import {
	type AbrirMantenimientoData,
	AbrirMantenimientoDialogComponent,
} from "../dialogs/abrir-mantenimiento-dialog.component";
import {
	type CerrarMantenimientoData,
	CerrarMantenimientoDialogComponent,
} from "../dialogs/cerrar-mantenimiento-dialog.component";
import {
	type FiltrosMantenimiento,
	MantenimientoService,
} from "../services/mantenimiento.service";

interface Opcion {
	id: number;
	nombre: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-lista-mantenimientos",
	standalone: false,
	templateUrl: "./lista-mantenimientos.component.html",
	styleUrl: "./lista-mantenimientos.component.css",
})
export class ListaMantenimientosComponent implements OnInit, OnDestroy {
	activos: ActivoListItem[] = [];
	personas: Opcion[] = [];
	proveedores: Opcion[] = [];

	paginaActual = 1;
	limitePorPagina = 10;
	filtros: FiltrosMantenimiento = {};

	private readonly mantenimientoService = inject(MantenimientoService);
	private readonly activoService = inject(ActivoService);
	private readonly datosService = inject(DatosService);
	private readonly router = inject(Router);
	private readonly dialog = inject(Dialog);
	private readonly cdr = inject(ChangeDetectorRef);
	private readonly refresco = signal(0);
	private readonly destroy$ = new Subject<void>();

	private readonly query = injectQuery(() => ({
		queryKey: [
			"mantenimientos",
			this.refresco(),
			{
				page: this.paginaActual,
				limit: this.limitePorPagina,
				filtros: this.filtros,
			},
		],
		queryFn: () =>
			firstValueFrom(
				this.mantenimientoService.listar(
					this.paginaActual,
					this.limitePorPagina,
					this.filtros,
				),
			),
		placeholderData: keepPreviousData,
		staleTime: 0,
	}));

	get mantenimientos(): MantenimientoItem[] {
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

	get cargando(): boolean {
		return this.query.isPending();
	}

	get errorMessage(): string {
		return getHttpErrorMessage(
			this.query.error(),
			"Error al cargar los mantenimientos",
		);
	}

	ngOnInit(): void {
		this.cargarCatalogos();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	cargarMantenimientos(): void {
		this.refresco.update((valor) => valor + 1);
	}

	aplicarFiltro(clave: keyof FiltrosMantenimiento, event: Event): void {
		const valor = (event.target as HTMLSelectElement).value;
		this.filtros = { ...this.filtros, [clave]: valor || undefined };
		this.paginaActual = 1;
		this.cargarMantenimientos();
	}

	cambiarPagina(pagina: number): void {
		if (pagina < 1 || pagina > this.pagination.totalPages) return;
		this.paginaActual = pagina;
		this.cargarMantenimientos();
	}

	verDetalle(id: number): void {
		this.router.navigate(["/mantenimientos", id]);
	}

	abrir(): void {
		if (this.activos.length === 0) {
			Swal.fire({
				icon: "info",
				title: "Sin activos disponibles",
				text: "No hay activos disponibles para abrir un mantenimiento.",
				confirmButtonColor: "#1e293b",
			});
			return;
		}

		const ref = this.dialog.open<
			CrearMantenimientoPayload | null,
			AbrirMantenimientoData
		>(AbrirMantenimientoDialogComponent, {
			data: {
				activos: this.activos.map((activo) => ({
					id: activo.id,
					nombre: activo.nombre,
				})),
				personas: this.personas,
				proveedores: this.proveedores,
			},
			width: "640px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload) return;

			this.mantenimientoService.crear(payload).subscribe({
				next: () => {
					this.avisar("Mantenimiento abierto");
					this.cargarMantenimientos();
					this.cargarCatalogos();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	cerrar(mantenimiento: MantenimientoItem): void {
		const ref = this.dialog.open<
			CerrarMantenimientoPayload | null,
			CerrarMantenimientoData
		>(CerrarMantenimientoDialogComponent, {
			data: { mantenimiento },
			width: "560px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload) return;

			this.mantenimientoService.cerrar(mantenimiento.id, payload).subscribe({
				next: () => {
					this.avisar("Mantenimiento cerrado");
					this.cargarMantenimientos();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}
	diasAbierto(mantenimiento: MantenimientoItem): number {
		if (!mantenimiento.fecha_salida) return 0;
		const inicio = new Date(mantenimiento.fecha_salida).getTime();
		const fin = mantenimiento.fecha_retorno
			? new Date(mantenimiento.fecha_retorno).getTime()
			: Date.now();
		return Math.max(Math.round((fin - inicio) / (1000 * 60 * 60 * 24)), 0);
	}

	trackById(_indice: number, mantenimiento: MantenimientoItem): number {
		return mantenimiento.id;
	}

	private cargarCatalogos(): void {
		this.activoService
			.getActivos(1, 100, "", "estado", "Disponible")
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (respuesta) => {
					this.activos = respuesta.data;
					this.cdr.markForCheck();
				},
				error: () => {},
			});

		this.datosService
			.obtenerDatosAuxiliares()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (respuesta) => {
					this.personas = (respuesta.data.duenos ?? []).map((p) => ({
						id: p.id,
						nombre: p.nombre,
					}));
					this.proveedores = (respuesta.data.proveedores ?? []).map((p) => ({
						id: p.id,
						nombre: p.nombre,
					}));
					this.cdr.markForCheck();
				},
				error: () => {},
			});
	}

	private avisar(mensaje: string): void {
		Swal.fire({
			toast: true,
			position: "top-end",
			icon: "success",
			title: mensaje,
			showConfirmButton: false,
			timer: 2500,
		});
	}

	private avisarError(error: { error?: { error?: string } }): void {
		Swal.fire({
			icon: "error",
			title: "No se pudo completar",
			text: error.error?.error ?? "Error inesperado",
			confirmButtonColor: "#1e293b",
		});
	}
}
