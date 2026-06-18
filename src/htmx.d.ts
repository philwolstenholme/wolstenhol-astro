declare module "@alpinejs/focus";

// Extend Astro's JSX attribute types to include HTMX and preload attributes
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    "hx-boost"?: string;
    "hx-delete"?: string;
    "hx-encoding"?: string;
    "hx-ext"?: string;
    "hx-get"?: string;
    "hx-headers"?: string;
    "hx-include"?: string;
    "hx-indicator"?: string;
    "hx-on"?: string;
    "hx-params"?: string;
    "hx-patch"?: string;
    "hx-post"?: string;
    "hx-preserve"?: string;
    "hx-prompt"?: string;
    "hx-push-url"?: string;
    "hx-put"?: string;
    "hx-replace-url"?: string;
    "hx-request"?: string;
    "hx-select"?: string;
    "hx-select-oob"?: string;
    "hx-swap"?: string;
    "hx-swap-oob"?: string;
    "hx-sync"?: string;
    "hx-target"?: string;
    "hx-trigger"?: string;
    "hx-validate"?: string;
    "hx-vals"?: string;
    preload?: string;
    "preload-images"?: string;
  }
}
