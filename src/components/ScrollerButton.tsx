import clsx from "clsx";
import type { ComponentChildren, JSX } from "preact";

const colorClasses: Record<string, string> = {
  green: "bg-green-700 hocus:bg-green-600",
  instagram: "bg-instagram hocus:bg-instagram-dark",
};

interface BaseProps {
  children?: ComponentChildren;
  class?: string;
  color?: keyof typeof colorClasses;
}

type LinkProps = BaseProps & JSX.HTMLAttributes<HTMLAnchorElement> & { href: string };
type ButtonProps = BaseProps & JSX.HTMLAttributes<HTMLButtonElement> & { href?: never };

type ScrollerButtonProps = LinkProps | ButtonProps;

export const ScrollerButton = ({
  children,
  class: className = "",
  color = "green",
  href,
  ...rest
}: ScrollerButtonProps) => {
  const classes = clsx(
    "rounded px-2 py-1 font-bold text-white shadow-(--shadow-hard) transition-colors",
    colorClasses[color],
    className,
  );

  if (href) {
    return (
      <a href={href} class={classes} {...(rest as JSX.HTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" class={classes} {...(rest as JSX.HTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
};
