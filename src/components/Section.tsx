import { h } from "preact";
import type { JSX } from "preact";
import type { ComponentChildren } from "preact";
import clsx from "clsx";
import { Heading } from "./Heading";

export interface SectionProps extends JSX.HTMLAttributes<HTMLElement> {
  class?: string;
  children?: ComponentChildren;
  heading?: string;
  lede?: JSX.Element | string;
}

export const Section = ({
  class: className = "",
  children,
  heading,
  lede,
  ...rest
}: SectionProps) => {
  return (
    <section class={clsx(className, "group/section")} {...rest}>
      {heading && (
        <Heading as="h2" class="mt-3">
          {heading}
        </Heading>
      )}
      {lede && (
        <p class="max-w-3xl font-serif leading-relaxed tracking-widest">
          {lede}
        </p>
      )}
      {children}
    </section>
  );
};
