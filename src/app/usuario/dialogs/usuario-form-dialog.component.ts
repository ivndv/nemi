import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { PreferenciasService } from "../../core/preferencias/preferencias.service";
import type {
	ActualizarPersonaPayload,
	CrearPersonaPayload,
	PersonaListItem,
} from "../../models/persona.interface";
import { ModalShellComponent } from "../../shared/ui/modal/modal-shell.component";

export interface UsuarioFormData {
	persona?: PersonaListItem;
	roles: { id: number; nombre: string }[];
	departamentos: { id: number; nombre: string }[];
}

export type UsuarioFormResult =
	| { tipo: "crear"; payload: CrearPersonaPayload }
	| { tipo: "editar"; payload: ActualizarPersonaPayload };

@Component({
	selector: "app-usuario-form-dialog",
	standalone: true,
	imports: [ReactiveFormsModule, ModalShellComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./usuario-form-dialog.component.html",
})
export class UsuarioFormDialogComponent {
	private readonly dialogRef =
		inject<DialogRef<UsuarioFormResult | null>>(DialogRef);
	private readonly preferencias = inject(PreferenciasService);
	readonly data = inject<UsuarioFormData>(DIALOG_DATA);
	readonly esNuevo = !this.data.persona;

	readonly form = inject(FormBuilder).group({
		nombre: [this.data.persona?.nombre ?? "", Validators.required],
		email: [
			this.data.persona?.email ?? "",
			[Validators.required, Validators.email],
		],
		rol: [this.data.persona?.rol ?? "", Validators.required],
		departamento: [this.data.persona?.departamento ?? "", Validators.required],
		fecha_ingreso: [
			this.data.persona?.fecha_ingreso ?? this.preferencias.fechaHoy(),
			Validators.required,
		],
		contrasena: [
			"",
			this.esNuevo ? [Validators.required, Validators.minLength(12)] : [],
		],
	});

	guardar(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const value = this.form.getRawValue();
		const base = {
			nombre: (value.nombre as string).trim(),
			email: (value.email as string).trim(),
			rol: value.rol as string,
			departamento: (value.departamento as string).trim(),
			fecha_ingreso: value.fecha_ingreso as string,
		};

		if (this.esNuevo) {
			this.dialogRef.close({
				tipo: "crear",
				payload: { ...base, contrasena: value.contrasena as string },
			});
			return;
		}

		this.dialogRef.close({ tipo: "editar", payload: base });
	}

	cancelar(): void {
		this.dialogRef.close(null);
	}
}
