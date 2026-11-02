import {
	computed,
	effect,
	Injectable,
	inject,
	RendererFactory2,
	signal,
} from "@angular/core";

export type Theme = "light" | "dark" | "system";

@Injectable({
	providedIn: "root",
})
export class ThemeService {
	private readonly renderer = inject(RendererFactory2).createRenderer(
		null,
		null,
	);
	private readonly storageKey = "nemi-theme";
	private readonly media = window.matchMedia?.(
		"(prefers-color-scheme: dark)",
	) as MediaQueryList | null;

	private readonly prefersDark = signal(this.media?.matches ?? false);

	readonly theme = signal<Theme>(this.resolveInitialTheme());
	readonly resolvedTheme = computed<"light" | "dark">(() => {
		const value = this.theme();
		if (value === "system") {
			return this.prefersDark() ? "dark" : "light";
		}
		return value;
	});
	readonly isDark = computed(() => this.resolvedTheme() === "dark");

	/** Compatibilidad con consumidores que leen el tema actual. */
	get current(): "light" | "dark" {
		return this.resolvedTheme();
	}

	constructor() {
		this.media?.addEventListener("change", (event) => {
			this.prefersDark.set(event.matches);
		});

		effect(() => {
			this.applyTheme(this.resolvedTheme());
			localStorage.setItem(this.storageKey, this.theme());
		});
	}

	toggle(): void {
		this.theme.set(this.isDark() ? "light" : "dark");
	}

	setTheme(theme: Theme): void {
		this.theme.set(theme);
	}

	private resolveInitialTheme(): Theme {
		const saved = localStorage.getItem(this.storageKey) as Theme | null;
		if (saved === "light" || saved === "dark" || saved === "system") {
			return saved;
		}

		return "system";
	}

	private applyTheme(theme: "light" | "dark"): void {
		this.renderer[theme === "dark" ? "addClass" : "removeClass"](
			document.body,
			"dark-mode",
		);
	}
}
