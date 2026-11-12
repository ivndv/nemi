import { Dialog } from "@angular/cdk/dialog";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
import { ActivoService } from "../../activo/service/activo.service";
import { DatosService } from "../../activo/service/datos.service";
import { AuthService } from "../../login/services/auth.service";
import type { ActivoListItem } from "../../models/activo.interface";
import type {
	AsientoLicencia,
	AsignarAsientoPayload,
	CrearRenovacionPayload,
	LicenciaDetalle,
} from "../../models/licencia.interface";
import {
	type AsignarAsientoData,
	AsignarAsientoDialogComponent,
} from "../dialogs/asignar-asiento-dialog.component";
import {
	type RenovarLicenciaData,
	RenovarLicenciaDialogComponent,
} from "../dialogs/renovar-licencia-dialog.component";
import { LicenciaService } from "../services/licencia.service";

interface Opcion {
	id: number;
	nombre: string;
}

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-detalle-licencia",
	standalone: false,
	templateUrl: "./detalle-licencia.component.html",
	styleUrl: "./detalle-licencia.component.css",
})
export class DetalleLicenciaComponent implements OnInit, OnDestroy {
	licencia: LicenciaDetalle | null = null;
	personas: Opcion[] = [];
	activos: ActivoListItem[] = [];
	cargando = true;
	errorMessage = "";

	private destroy$ = new Subject<void>();

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private licenciaService: LicenciaService,
		private activoService: ActivoService,
		private datosService: DatosService,
		private authService: AuthService,
		private dialog: Dialog,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			const id = Number(params.get("id"));
			if (Number.isNaN(id)) {
				this.errorMessage = "ID de licencia inválido";
				this.cargando = false;
				return;
			}
			this.cargarDetalle(id);
		});

		this.cargarCatalogos();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	puedeOperar(): boolean {
		return this.authService.puedeOperar();
	}

	puedeRenovar(): boolean {
		return this.authService.isAdmin() || this.authService.isTecnico();
	}

	puedeVerCostos(): boolean {
		return this.authService.isAdmin() || this.authService.isTecnico();
	}

	volver(): void {
		this.router.navigate(["/licencias"]);
	}

	liberar(asiento: AsientoLicencia): void {
		if (!this.licencia) return;

		Swal.fire({
			icon: "warning",
			title: `Liberar asiento ${asiento.asiento}`,
			text: `Se liberará el asiento asignado a ${
				asiento.persona ?? asiento.activo ?? "—"
			}.`,
			showCancelButton: true,
			confirmButtonText: "Liberar",
			cancelButtonText: "Cancelar",
			confirmButtonColor: "#1e293b",
		}).then((resultado) => {
			if (!resultado.isConfirmed || !this.licencia) return;

			this.licenciaService
				.liberarAsiento(this.licencia.activo_id, asiento.asiento)
				.subscribe({
					next: () => {
						this.avisar("Asiento liberado");
						this.cargarDetalle(this.licencia?.activo_id as number);
					},
					error: (error) => this.avisarError(error),
				});
		});
	}

	asignarAsiento(): void {
		if (!this.licencia) return;

		const ref = this.dialog.open<
			AsignarAsientoPayload | null,
			AsignarAsientoData
		>(AsignarAsientoDialogComponent, {
			data: {
				personas: this.personas,
				activos: this.activos.map((activo) => ({
					id: activo.id,
					nombre: activo.nombre,
				})),
			},
			width: "560px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload || !this.licencia) return;

			this.licenciaService
				.asignarAsiento(this.licencia.activo_id, payload)
				.subscribe({
					next: () => {
						this.avisar("Asiento asignado");
						this.cargarDetalle(this.licencia?.activo_id as number);
					},
					error: (error) => this.avisarError(error),
				});
		});
	}
	renovar(): void {
		if (!this.licencia) return;

		const ref = this.dialog.open<
			CrearRenovacionPayload | null,
			RenovarLicenciaData
		>(RenovarLicenciaDialogComponent, {
			data: { licencia: this.licencia },
			width: "520px",
			maxWidth: "92vw",
			autoFocus: "first-tabbable",
		});

		ref.closed.subscribe((payload) => {
			if (!payload || !this.licencia) return;

			this.licenciaService
				.crearRenovacion(this.licencia.activo_id, payload)
				.subscribe({
					next: () => {
						this.avisar("Renovación registrada");
						this.cargarDetalle(this.licencia?.activo_id as number);
					},
					error: (error) => this.avisarError(error),
				});
		});
	}
	trackAsiento(_indice: number, asiento: AsientoLicencia): number {
		return asiento.id;
	}

	private cargarDetalle(id: number): void {
		this.cargando = true;
		this.licenciaService.detalle(id).subscribe({
			next: (respuesta) => {
				this.licencia = respuesta.data;
				this.cargando = false;
				this.errorMessage = "";
				this.cdr.markForCheck();
			},
			error: (error) => {
				this.errorMessage =
					error.error?.error ?? "No se pudo cargar la licencia";
				this.cargando = false;
				this.cdr.markForCheck();
			},
		});
	}

	private cargarCatalogos(): void {
		this.activoService
			.getActivos(1, 100)
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
					this.personas = (respuesta.data.duenos ?? []).map((persona) => ({
						id: persona.id,
						nombre: persona.nombre,
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
