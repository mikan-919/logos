// Self-rolled FLIP: morph a shared element between two layouts. crossfade's
// send/receive, but driven manually so we control exactly when rects are read.
//
// Usage:
//   1. captureFlip(["trajectory"])  // BEFORE the layout change, while the
//      outgoing element is still mounted and laid out
//   2. mutate state, then `await tick()`
//   3. the freshly mounted element's `use:flip={{ key }}` reads the captured
//      rect, computes First−Last, and animates the inverse back to identity.

const captured = new Map<string, DOMRect>();

// app.css `--ease: cubic-bezier(.2,.0,.0,1)`, ported to JS for WAAPI.
const EASE = "cubic-bezier(.2,.0,.0,1)";

export function captureFlip(keys: string[]) {
	for (const key of keys) {
		const el = document.querySelector<HTMLElement>(`[data-flip-key="${key}"]`);
		if (el) captured.set(key, el.getBoundingClientRect());
	}
}

type FlipParams = { key: string; duration?: number; easing?: string };

export function flip(node: HTMLElement, params: FlipParams) {
	let { key } = params;
	node.dataset.flipKey = key;

	const duration = params.duration ?? 460;
	const easing = params.easing ?? EASE;
	let anim: Animation | null = null;

	const first = captured.get(key);
	if (first) {
		captured.delete(key);
		// Read the "Last" rect on the next frame so the new layout has settled.
		requestAnimationFrame(() => {
			const last = node.getBoundingClientRect();
			if (!last.width || !last.height) return;
			const dx = first.left - last.left;
			const dy = first.top - last.top;
			const sx = first.width / last.width;
			const sy = first.height / last.height;
			if (
				Math.abs(dx) < 0.5 &&
				Math.abs(dy) < 0.5 &&
				Math.abs(sx - 1) < 0.01 &&
				Math.abs(sy - 1) < 0.01
			)
				return;
			anim = node.animate(
				[
					{
						transformOrigin: "top left",
						transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
					},
					{ transformOrigin: "top left", transform: "translate(0, 0) scale(1, 1)" },
				],
				{ duration, easing, fill: "none" },
			);
		});
	}

	return {
		update(p: FlipParams) {
			key = p.key;
			node.dataset.flipKey = key;
		},
		destroy() {
			anim?.cancel();
		},
	};
}
