import htmx from "htmx.org";

// Preload extension (htmx.org/dist/ext/preload.js)
// Prefetches hx-get URLs on mouseover so swaps feel instant.
// Add the `preload` attribute to any element with hx-get to opt in.
htmx.defineExtension("preload", {
  onEvent: function (name, event): boolean {
    if (name !== "htmx:afterProcessNode") {
      return true;
    }

    const attr = (node: Element | undefined, property: string): string | undefined => {
      if (!node) {
        return undefined;
      }
      return (
        node.getAttribute(property) ||
        node.getAttribute("data-" + property) ||
        attr(node.parentElement ?? undefined, property) ||
        undefined
      );
    };

    const load = (node: Element & Record<string, unknown>) => {
      const done = (html: string) => {
        if (!node.preloadAlways) {
          node.preloadState = "DONE";
        }
        if (attr(node, "preload-images") === "true") {
          document.createElement("div").innerHTML = html;
        }
      };

      return () => {
        if (node.preloadState !== "READY") {
          return;
        }
        const hxGet = node.getAttribute("hx-get") || node.getAttribute("data-hx-get");
        if (hxGet) {
          htmx.ajax("get", hxGet, {
            handler: (_elt: unknown, info: { xhr: XMLHttpRequest }) => done(info.xhr.responseText),
            source: node,
          });
          return;
        }
        const href = node.getAttribute("href");
        if (href) {
          const r = new XMLHttpRequest();
          r.open("GET", href);
          r.onload = () => done(r.responseText);
          r.send();
        }
      };
    };

    const init = (node: Element & Record<string, unknown>) => {
      if (
        (node.getAttribute("href") ?? "") +
          (node.getAttribute("hx-get") ?? "") +
          (node.getAttribute("data-hx-get") ?? "") ===
        ""
      ) {
        return;
      }
      if (node.preloadState !== undefined) {
        return;
      }

      let on: string = attr(node, "preload") ?? "mousedown";
      const always = on.includes("always");
      if (always) {
        on = on.replace("always", "").trim();
      }

      node.addEventListener(on, () => {
        if (node.preloadState === "PAUSE") {
          node.preloadState = "READY";
          if (on === "mouseover") {
            window.setTimeout(load(node), 100);
          } else {
            load(node)();
          }
        }
      });

      if (on === "mouseover") {
        node.addEventListener("touchstart", load(node));
        node.addEventListener("mouseout", (evt) => {
          if ((evt as MouseEvent).target === node && node.preloadState === "READY") {
            node.preloadState = "PAUSE";
          }
        });
      } else if (on === "mousedown") {
        node.addEventListener("touchstart", load(node));
      }

      node.preloadState = "PAUSE";
      node.preloadAlways = always;
      htmx.trigger(node, "preload:init");
    };

    (event.target as Element).querySelectorAll("[preload]").forEach((node) => {
      init(node as Element & Record<string, unknown>);
      node
        .querySelectorAll("a,[hx-get],[data-hx-get]")
        .forEach((child) => init(child as Element & Record<string, unknown>));
    });
    return true;
  },
});
