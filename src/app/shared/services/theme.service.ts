import { Injectable, Renderer2, RendererFactory2 } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export type Theme = "light" | "dark";

@Injectable({
	providedIn: "root",
})
export class ThemeService {
	private renderer: Renderer2;
	private themeSubject: BehaviorSubject<Theme>;
	private readonly STORAGE_KEY = "nemi-theme";

	theme$: Observable<Theme>;

	constructor(rendererFactory: RendererFactory2) {
		this.renderer = rendererFactory.createRenderer(null, null);

		const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
		const prefersDark =
			window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
		const initial: Theme = saved ?? (prefersDark ? "dark" : "light");

		this.themeSubject = new BehaviorSubject<Theme>(initial);
		this.theme$ = this.themeSubject.asObservable();

		this.applyTheme(initial);
	}

	get current(): Theme {
		return this.themeSubject.value;
	}

	toggle(): void {
		const next = this.current === "light" ? "dark" : "light";
		this.themeSubject.next(next);
		this.applyTheme(next);
		localStorage.setItem(this.STORAGE_KEY, next);
	}

	setTheme(theme: Theme): void {
		this.themeSubject.next(theme);
		this.applyTheme(theme);
		localStorage.setItem(this.STORAGE_KEY, theme);
	}

	private applyTheme(theme: Theme): void {
		if (theme === "dark") {
			this.renderer.addClass(document.body, "dark-mode");
		} else {
			this.renderer.removeClass(document.body, "dark-mode");
		}
	}
}
