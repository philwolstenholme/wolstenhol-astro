import type Alpine from "alpinejs";

export const defineComponent = <T extends object>(
  factory: (...args: never[]) => Alpine.AlpineComponent<T>,
) => factory;
