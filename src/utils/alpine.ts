import type { AlpineComponent } from 'alpinejs';

export const defineAlpineComponent = <P, T>(fn: (params: P) => AlpineComponent<T>) => fn;
