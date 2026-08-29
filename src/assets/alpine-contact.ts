import { defineComponent } from "./alpine-define";

type FormFields = "agreement" | "email" | "message" | "name" | "subject";

const FIELDS: FormFields[] = ["name", "email", "subject", "message", "agreement"];

const FIELD_LABELS: Record<FormFields, string> = {
  agreement: "Agreement",
  email: "Email",
  message: "Message",
  name: "Name",
  subject: "Subject",
};

const RULES: Record<FormFields, (val: string) => null | string> = {
  agreement: (v) =>
    v !== "true" ? "please tick the box to confirm you have read the above." : null,
  email: (v) => {
    if (!v.trim()) {
      return "please enter your email address.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
      return "please enter a valid email address.";
    }
    return null;
  },
  message: (v) =>
    v.trim().length < 8 ? "please enter your message (at least 8 characters)." : null,
  name: (v) => (v.trim().length < 2 ? "please enter your name (at least 2 characters)." : null),
  subject: (v) => (v.trim().length < 8 ? "please enter a subject (at least 8 characters)." : null),
};

export default defineComponent(() => ({
  _cleanup: null as (() => void) | null,
  destroy() {
    this._cleanup?.();
  },
  get errorList() {
    return FIELDS.filter((f) => this.errors[f] !== null).map((f) => ({
      id: `contact-${f}`,
      label: FIELD_LABELS[f],
      message: this.errors[f],
    }));
  },
  errors: Object.fromEntries(FIELDS.map((f) => [f, null])) as Record<FormFields, null | string>,
  init() {
    // htmx 4 renamed the event to `htmx:after:request` and no longer exposes a
    // top-level `successful` flag — success is derived from the response status
    // on `detail.ctx`. A network failure (fetch reject) fires `htmx:error`
    // instead of `htmx:after:request`, so both are handled.
    const onAfterRequest = (e: Event) => {
      const ctx = (e as CustomEvent).detail?.ctx as undefined | { response?: { status: number } };
      const status = ctx?.response?.status;
      if (status != null && status < 400) {
        this.submitted = true;
        this.showSummary = false;
        document.dispatchEvent(new CustomEvent("play-sound", { detail: "success" }));
        void this.$nextTick(() => {
          (this.$refs["successMessage"] as HTMLElement)?.focus();
        });
      } else {
        this.submitError = true;
      }
    };
    const onError = () => {
      this.submitError = true;
    };
    this.$el.addEventListener("htmx:after:request", onAfterRequest);
    this.$el.addEventListener("htmx:error", onError);
    this._cleanup = () => {
      this.$el.removeEventListener("htmx:after:request", onAfterRequest);
      this.$el.removeEventListener("htmx:error", onError);
    };
  },
  showSummary: false,
  submit(formEl: HTMLFormElement) {
    const isValid = this.validateAll();
    this.showSummary = !isValid;
    if (!isValid) {
      document.dispatchEvent(new CustomEvent("play-sound", { detail: "error" }));
      void this.$nextTick(() => {
        (this.$refs["summary"] as HTMLElement)?.focus();
      });
      return;
    }
    formEl.dispatchEvent(new CustomEvent("pwContactSubmit", { bubbles: true }));
  },

  submitError: false,

  submitted: false,

  touch(field: FormFields) {
    this.touched[field] = true;
    this.errors[field] = RULES[field](this.values[field]);
    if (this.showSummary) {
      this.showSummary = FIELDS.some((f) => this.errors[f] !== null);
    }
  },

  touched: Object.fromEntries(FIELDS.map((f) => [f, false])) as Record<FormFields, boolean>,

  validateAll(): boolean {
    let valid = true;
    for (const field of FIELDS) {
      this.touched[field] = true;
      const error = RULES[field](this.values[field]);
      this.errors[field] = error;
      if (error) {
        valid = false;
      }
    }
    return valid;
  },

  values: Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<FormFields, string>,
}));
