import type { JSX, ComponentChildren } from "preact";
import clsx from "clsx";

export interface StyledTextLinkProps
  extends Omit<JSX.HTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ComponentChildren;
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
