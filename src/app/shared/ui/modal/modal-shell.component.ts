import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	EventEmitter,
	Input,
	Output,
} from "@angular/core";

@Component({
	selector: "app-modal-shell",
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: `
		<section class="modal-card">
			<header class="modal-header">
				<div class="modal-heading">
					<h2>{{ title }}</h2>
					@if (subtitle) {
						<p>{{ subtitle }}</p>
					}
				</div>
				<button
					type="button"
					class="modal-close"
					(click)="closed.emit()"
					aria-label="Cerrar"
				>
					<iconify-icon icon="ph:x"></iconify-icon>
				</button>
			</header>

			<div class="modal-body">
				<ng-content></ng-content>
			</div>
		</section>
	`,
	styles: [
		`
			:host {
				display: block;
			}

			.modal-card {
				background: var(--surface);
				border: 1px solid var(--border);
				border-radius: var(--radius-xl);
				box-shadow: var(--shadow-lg);
				overflow: hidden;
			}

			.modal-header {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: 16px;
				padding: 20px 22px 16px;
				border-bottom: 1px solid var(--border-soft);
			}

			.modal-heading h2 {
				margin: 0;
				font-size: 18px;
				font-weight: 600;
				letter-spacing: -0.02em;
				color: var(--text);
			}

			.modal-heading p {
				margin: 3px 0 0;
				font-size: 12.5px;
				color: var(--text-muted);
			}

			.modal-close {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 32px;
				height: 32px;
				border-radius: var(--radius-sm);
				color: var(--text-muted);
				font-size: 18px;
				cursor: pointer;
			}

			.modal-close:hover {
				background: var(--surface-muted);
				color: var(--text);
			}

			.modal-body {
				padding: 22px;
				max-height: 72vh;
				overflow-y: auto;
			}
		`,
	],
})
export class ModalShellComponent {
	@Input({ required: true }) title!: string;
	@Input() subtitle = "";
	@Output() closed = new EventEmitter<void>();
}
