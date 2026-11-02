import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import type { CrearSolicitudPayload } from "../../models/solicitud.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface NuevaSolicitudData {
	tipos: { id: number; nombre: string }[];
}

@Component({
	selector: "app-nueva-solicitud-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./nueva-solicitud-dialog.component.html",
})
export class NuevaSolicitudDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<CrearSolicitudPayload | null>>(DialogRef);
	readonly data = inject<NuevaSolicitudData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		tipo: ["equipo", Validators.required],
		tipo_activo_id: [null as number | null],
		prioridad: ["media", Validators.required],
		motivo: ["", [Validators.required, Validators.minLength(5)]],
	});

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const payload: CrearSolicitudPayload = {
			tipo: value.tipo as "equipo" | "licencia" | "accesorio" | "reemplazo",
			tipo_activo_id:
				value.tipo_activo_id === null
					? undefined
					: Number(value.tipo_activo_id),
			prioridad: value.prioridad as "baja" | "media" | "alta",
			motivo: (value.motivo as string).trim(),
		};

		this.dialogRef.close(payload);
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
