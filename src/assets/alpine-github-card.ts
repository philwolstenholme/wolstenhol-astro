import Alpine from "alpinejs";

Alpine.data("githubCard", () => ({
  replay() {
    const title = this.$refs.title as HTMLElement | undefined;
    if (!title || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const duration = getComputedStyle(this.$el).getPropertyValue("--typewriter-duration").trim();
    title.style.animation = "none";
    void title.offsetWidth;
    title.style.animation = `typewriter ${duration} steps(69) both`;
  },
}));
