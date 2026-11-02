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
import type {
	CerrarMantenimientoPayload,
	MantenimientoItem,
} from "../../models/mantenimiento.interface";
import {
	type CerrarMantenimientoData,
	CerrarMantenimientoDialogComponent,
} from "../dialogs/cerrar-mantenimiento-dialog.component";
import { MantenimientoService } from "../services/mantenimiento.service";

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-detalle-mantenimiento",
	standalone: false,
	templateUrl: "./detalle-mantenimiento.component.html",
	styleUrl: "./detalle-mantenimiento.component.css",
})
export class DetalleMantenimientoComponent implements OnInit, OnDestroy {
	mantenimiento: MantenimientoItem | null = null;
	cargando = true;
	errorMessage = "";
	private destroy$ = new Subject<void>();

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private mantenimientoService: MantenimientoService,
		private dialog: Dialog,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			const id = Number(params.get("id"));
			if (Number.isNaN(id)) {
				this.errorMessage = "ID inválido";
				this.cargando = false;
				return;
			}
			this.cargar(id);
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	volver(): void {
		this.router.navigate(["/mantenimientos"]);
	}

	cerrar(): void {
		if (!this.mantenimiento) return;

		const mantenimiento = this.mantenimiento;
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
					Swal.fire({
						toast: true,
						position: "top-end",
						icon: "success",
						title: "Mantenimiento cerrado",
						showConfirmButton: false,
						timer: 2500,
					});
					this.cargar(mantenimiento.id);
				},
				error: (error) =>
					Swal.fire({
						icon: "error",
						title: "No se pudo cerrar",
						text: error.error?.error ?? "Error inesperado",
						confirmButtonColor: "#1e293b",
					}),
			});
		});
	}
	private cargar(id: number): void {
		this.cargando = true;
		this.mantenimientoService.detalle(id).subscribe({
			next: (respuesta) => {
				this.mantenimiento = respuesta.data;
				this.cargando = false;
				this.errorMessage = "";
				this.cdr.markForCheck();
			},
			error: (error) => {
				this.errorMessage =
					error.error?.error ?? "No se pudo cargar el mantenimiento";
				this.cargando = false;
				this.cdr.markForCheck();
			},
		});
	}
}
