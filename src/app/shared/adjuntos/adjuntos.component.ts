import { Dialog } from "@angular/cdk/dialog";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
} from "@angular/core";
import Swal from "sweetalert2";
import { AuthService } from "../../login/services/auth.service";
import type { AdjuntoItem } from "../../models/adjunto.interface";
import {
	type SubirAdjuntoData,
	SubirAdjuntoDialogComponent,
	type SubirAdjuntoResult,
} from "./dialogs/subir-adjunto-dialog.component";
import { AdjuntoService } from "./services/adjunto.service";

type EntidadAdjunto = AdjuntoItem["entidad"];

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: "app-adjuntos",
	standalone: false,
	templateUrl: "./adjuntos.component.html",
	styleUrl: "./adjuntos.component.css",
})
export class AdjuntosComponent implements OnInit, OnChanges {
	@Input({ required: true }) entidad!: EntidadAdjunto;
	@Input({ required: true }) entidadId!: number;
	@Input() puedeEditar?: boolean;

	adjuntos: AdjuntoItem[] = [];
	cargando = false;
	subiendo = false;
	errorMessage = "";

	constructor(
		private adjuntoService: AdjuntoService,
		private authService: AuthService,
		private dialog: Dialog,
		private cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.cargar();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["entidadId"] && !changes["entidadId"].firstChange) {
			this.cargar();
		}
	}

	permiteEditar(): boolean {
		return this.puedeEditar ?? this.authService.puedeOperar();
	}

	cargar(): void {
		if (!this.entidadId) return;
		this.cargando = true;
		this.adjuntoService.listar(this.entidad, this.entidadId).subscribe({
			next: (respuesta) => {
				this.adjuntos = respuesta.data;
				this.cargando = false;
				this.errorMessage = "";
				this.cdr.markForCheck();
			},
			error: (error) => {
				this.errorMessage =
					error.error?.error ?? "No se pudieron cargar los archivos";
				this.cargando = false;
				this.cdr.markForCheck();
			},
		});
	}

	abrirSubida(): void {
		const ref = this.dialog.open<SubirAdjuntoResult | null, SubirAdjuntoData>(
			SubirAdjuntoDialogComponent,
			{
				data: { entidad: this.entidad },
				width: "520px",
				maxWidth: "92vw",
				autoFocus: "first-tabbable",
			},
		);

		ref.closed.subscribe((resultado) => {
			if (!resultado) return;

			this.subiendo = true;
			this.adjuntoService
				.crear(resultado.file, {
					entidad: this.entidad,
					entidad_id: this.entidadId,
					tipo: resultado.tipo,
					nombre: resultado.file.name,
				})
				.subscribe({
					next: () => {
						this.subiendo = false;
						this.avisar("Archivo subido");
						this.cargar();
					},
					error: (error) => {
						this.subiendo = false;
						this.avisarError(error);
						this.cdr.markForCheck();
					},
				});
		});
	}
	eliminar(adjunto: AdjuntoItem): void {
		Swal.fire({
			icon: "warning",
			title: "Eliminar archivo",
			text: `Se eliminará "${adjunto.nombre}" de R2 y de la base.`,
			showCancelButton: true,
			confirmButtonText: "Eliminar",
			cancelButtonText: "Cancelar",
			confirmButtonColor: "#b91c1c",
		}).then((resultado) => {
			if (!resultado.isConfirmed) return;

			this.adjuntoService.eliminar(adjunto.id).subscribe({
				next: () => {
					this.avisar("Archivo eliminado");
					this.cargar();
				},
				error: (error) => this.avisarError(error),
			});
		});
	}

	tamano(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	private avisar(mensaje: string): void {
		Swal.fire({
			toast: true,
			position: "top-end",
			icon: "success",
			title: mensaje,
			showConfirmButton: false,
			timer: 2200,
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
