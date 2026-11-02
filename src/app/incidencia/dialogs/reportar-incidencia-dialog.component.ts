import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import type { CrearIncidenciaPayload } from "../../models/incidencia.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface ReportarIncidenciaData {
	activos: { id: number; nombre: string }[];
}

@Component({
	selector: "app-reportar-incidencia-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./reportar-incidencia-dialog.component.html",
})
export class ReportarIncidenciaDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<CrearIncidenciaPayload | null>>(DialogRef);
	readonly data = inject<ReportarIncidenciaData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		activo_id: [null as number | null, Validators.required],
		prioridad: ["media", Validators.required],
		descripcion: ["", [Validators.required, Validators.minLength(5)]],
	});

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: CrearIncidenciaPayload = {
			activo_id: Number(value.activo_id),
			prioridad: value.prioridad as "baja" | "media" | "alta",
			descripcion: (value.descripcion as string).trim(),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
