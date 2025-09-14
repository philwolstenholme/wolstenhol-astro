import { h } from "preact";
import type { JSX } from "preact";
import clsx from "clsx";

export interface StyledTextLinkProps
  extends Omit<JSX.HTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: preact.ComponentChildren;
}

export const StyledTextLink = ({
  href,
  class: className = "",
  children,
  ...rest
}: StyledTextLinkProps) => {
  return (
    <a href={href} class={clsx("underline", className)} {...rest}>
      {children}
    </a>
  );
};
