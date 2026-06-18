import slugify from "@sindresorhus/slugify";
import clsx from "clsx";
import type { HTMLAttributes } from "preact";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
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

export const Heading = ({ as, class: className = "", children, ...rest }: HeadingProps) => {
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
