declare module "@alpinejs/focus";

// Extend Astro's JSX attribute types to include htmx 4 attributes.
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    "hx-boost"?: string;
    "hx-config"?: string;
    "hx-confirm"?: string;
    "hx-delete"?: string;
    "hx-disable"?: string;
    "hx-encoding"?: string;
    "hx-get"?: string;
    "hx-headers"?: string;
    "hx-ignore"?: string;
    "hx-include"?: string;
    "hx-indicator"?: string;
    "hx-on"?: string;
    "hx-patch"?: string;
    "hx-post"?: string;
    "hx-preload"?: string;
    "hx-preserve"?: string;
    "hx-prompt"?: string;
    "hx-push-url"?: string;
    "hx-put"?: string;
    "hx-replace-url"?: string;
    "hx-select"?: string;
    "hx-select-oob"?: string;
    "hx-status"?: string;
    "hx-swap"?: string;
    "hx-swap-oob"?: string;
    "hx-sync"?: string;
    "hx-target"?: string;
    "hx-trigger"?: string;
    "hx-validate"?: string;
    "hx-vals"?: string;
  }
}
