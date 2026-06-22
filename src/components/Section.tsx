import clsx from "clsx";
import type { JSX, ComponentChildren, HTMLAttributes } from "preact";

import { Heading } from "./Heading";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  class?: string;
  children?: ComponentChildren;
  heading?: string;
  lede?: JSX.Element | string;
  hasScroller?: boolean;
}

export const Section = ({
  class: className = "",
  children,
  heading,
  lede,
  hasScroller = false,
  id,
  ...rest
}: SectionProps) => {
  return (
    <section
      class={clsx(className, "group/section", hasScroller && "col-[full] constrain-content")}
      id={id}
      {...rest}
    >
      {heading && (
        <Heading as="h2" class="mt-3 scroll-mt-8" id={undefined} data-section={id}>
          {heading}
        </Heading>
      )}
      {lede && <p class="max-w-3xl font-serif leading-relaxed tracking-widest">{lede}</p>}
      {children}
    </section>
  );
};
