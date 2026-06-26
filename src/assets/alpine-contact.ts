import Alpine from "alpinejs";

type FormFields = "name" | "email" | "subject" | "message" | "agreement";

const FIELDS: FormFields[] = ["name", "email", "subject", "message", "agreement"];

const FIELD_LABELS: Record<FormFields, string> = {
  name: "Name",
  email: "Email",
  subject: "Subject",
  message: "Message",
  agreement: "Agreement",
};

const RULES: Record<FormFields, (val: string) => string | null> = {
  name: (v) => (v.trim().length < 2 ? "Please enter your name (at least 2 characters)." : null),
  email: (v) => {
    if (!v.trim()) {
      return "Please enter your email address.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
      return "Please enter a valid email address.";
    }
    return null;
  },
  subject: (v) => (v.trim().length < 8 ? "Please enter a subject (at least 8 characters)." : null),
  message: (v) =>
    v.trim().length < 8 ? "Please enter your message (at least 8 characters)." : null,
  agreement: (v) =>
    v !== "true" ? "Please tick the box to confirm you have read the above." : null,
};

Alpine.data("pwContact", () => ({
  submitted: false,
  submitError: false,
  showSummary: false,
  values: Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<FormFields, string>,
  errors: Object.fromEntries(FIELDS.map((f) => [f, null])) as Record<FormFields, string | null>,
  touched: Object.fromEntries(FIELDS.map((f) => [f, false])) as Record<FormFields, boolean>,

  init() {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { successful: boolean };
      if (detail.successful) {
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
    this.$el.addEventListener("htmx:afterRequest", handler);
    // @ts-expect-error -- Alpine's $cleanup magic is absent from the generated types
    this.$cleanup(() => this.$el.removeEventListener("htmx:afterRequest", handler));
  },

  touch(field: FormFields) {
    this.touched[field] = true;
    this.errors[field] = RULES[field](this.values[field]);
    if (this.showSummary) {
      this.showSummary = FIELDS.some((f) => this.errors[f] !== null);
    }
  },

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

  get errorList() {
    return FIELDS.filter((f) => this.errors[f] !== null).map((f) => ({
      id: `contact-${f}`,
      label: FIELD_LABELS[f],
      message: this.errors[f],
    }));
  },

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
}));
