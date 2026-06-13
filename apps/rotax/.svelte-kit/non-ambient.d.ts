
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/tasks" | "/api/tasks/[id]" | "/api/tasks/[id]/schedule" | "/api/tasks/[id]/status";
		RouteParams(): {
			"/api/tasks/[id]": { id: string };
			"/api/tasks/[id]/schedule": { id: string };
			"/api/tasks/[id]/status": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/tasks": { id?: string | undefined };
			"/api/tasks/[id]": { id: string };
			"/api/tasks/[id]/schedule": { id: string };
			"/api/tasks/[id]/status": { id: string }
		};
		Pathname(): "/" | "/api/tasks" | `/api/tasks/${string}` & {} | `/api/tasks/${string}/schedule` & {} | `/api/tasks/${string}/status` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}