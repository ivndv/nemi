import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import type { SolicitudItem } from "../../models/solicitud.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface DecisionSolicitudData {
	solicitud: SolicitudItem;
	decision: "aprobar" | "rechazar";
}

export interface DecisionSolicitudResult {
	comentario?: string;
}

@Component({
	selector: "app-decision-solicitud-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./decision-solicitud-dialog.component.html",
})
export class DecisionSolicitudDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<DecisionSolicitudResult | null>>(DialogRef);
	readonly data = inject<DecisionSolicitudData>(DIALOG_DATA);

	readonly form = inject(FormBuilder).group({
		comentario: [""],
	});

	get esAprobar(): boolean {
		return this.data.decision === "aprobar";
	}

	guardar(): void {
		const comentario = (this.form.value.comentario ?? "").trim();
		this.dialogRef.close({
			comentario: comentario || undefined,
		});
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
