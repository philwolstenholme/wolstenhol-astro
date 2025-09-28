import type { JSX } from "preact";
import clsx from "clsx";
import slugify from "@sindresorhus/slugify";

export interface HeadingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const sizeMap = {
  h1: "text-5xl",
  h2: "text-4xl",
  h3: "text-3xl",
  h4: "text-2xl",
  h5: "text-xl",
  h6: "text-lg",
};

export const Heading = ({
  as,
  class: className = "",
  children,
  ...rest
}: HeadingProps) => {
  const Tag = as;
  const sizeClass = sizeMap[as] || "text-lg";
  return (
    <Tag
      id={slugify(typeof children === "string" ? children : "")}
      class={clsx(sizeClass, "font-bold", "font-serif", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};
