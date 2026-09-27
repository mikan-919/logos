import { render } from "irisout";

// Lucide icon paths, ISC license: https://lucide.dev/license
export function Icon({ name }) {
  render(
    <svg
      class="lucide-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <g data-hidden={name !== "x"}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </g>
      <g data-hidden={name !== "plus"}>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </g>
      <g data-hidden={name !== "check"}>
        <path d="M20 6 9 17l-5-5" />
      </g>
      <g data-hidden={name !== "chevronRight"}>
        <path d="m9 18 6-6-6-6" />
      </g>
      <g data-hidden={name !== "sparkles"}>
        <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
        <path d="M20 2v4" />
        <path d="M22 4h-4" />
        <circle cx="4" cy="20" r="2" />
      </g>
      <g data-hidden={name !== "search"}>
        <path d="m21 21-4.34-4.34" />
        <circle cx="11" cy="11" r="8" />
      </g>
      <g data-hidden={name !== "pencil"}>
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
      </g>
      <g data-hidden={name !== "combine"}>
        <path d="M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" />
        <path d="M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" />
        <path d="m7 15 3 3" />
        <path d="m7 21 3-3H5a2 2 0 0 1-2-2v-2" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="3" width="7" height="7" rx="1" />
      </g>
      <g data-hidden={name !== "userRound"}>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </g>
      <g data-hidden={name !== "bold"}>
        <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
      </g>
      <g data-hidden={name !== "italic"}>
        <line x1="19" x2="10" y1="4" y2="4" />
        <line x1="14" x2="5" y1="20" y2="20" />
        <line x1="15" x2="9" y1="4" y2="20" />
      </g>
    </svg>,
  );
}
