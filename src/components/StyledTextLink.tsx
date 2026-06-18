import clsx from "clsx";
import type { ComponentChildren, HTMLAttributes } from "preact";

export interface StyledTextLinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, "href"> {
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
