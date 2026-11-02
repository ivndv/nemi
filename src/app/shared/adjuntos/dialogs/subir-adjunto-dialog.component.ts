import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	inject,
	signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import type { AdjuntoItem } from "../../../models/adjunto.interface";
import { ModalShellComponent } from "../../ui/modal/modal-shell.component";

export type TipoAdjunto = AdjuntoItem["tipo"];

export interface SubirAdjuntoData {
	entidad: string;
}

export interface SubirAdjuntoResult {
	file: File;
	tipo: TipoAdjunto;
}

@Component({
	selector: "app-subir-adjunto-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./subir-adjunto-dialog.component.html",
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SubirAdjuntoDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<SubirAdjuntoResult | null>>(DialogRef);
	readonly data = inject<SubirAdjuntoData>(DIALOG_DATA);

	readonly archivo = signal<File | null>(null);
	readonly error = signal("");
	readonly form = inject(FormBuilder).group({
		tipo: ["factura"],
	});

	onFileSelected(event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) this.validarArchivo(file);
	}

	onDrop(event: DragEvent): void {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (file) this.validarArchivo(file);
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
	}

	quitarArchivo(): void {
		this.archivo.set(null);
		this.error.set("");
	}

	guardar(): void {
		const file = this.archivo();
		if (!file) {
			this.error.set("Selecciona un archivo");
			return;
		}

		this.dialogRef.close({
			file,
			tipo: this.form.value.tipo as TipoAdjunto,
		});
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}

	tamano(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	private validarArchivo(file: File): void {
		const permitidos = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/svg+xml",
			"application/pdf",
		];

		if (!permitidos.includes(file.type)) {
			this.error.set("Formato no permitido. Usa JPG, PNG, WEBP, SVG o PDF.");
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			this.error.set("El archivo no puede superar 10 MB.");
			return;
		}

		this.error.set("");
		this.archivo.set(file);
	}
}
