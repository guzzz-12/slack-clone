import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = {
  variant: "h1" | "h2" | "h3" | "h4" | "h5" | "p" | "span";
  text: string;
  className?: HTMLAttributes<HTMLElement>["className"];
} & HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>

const Typography = ({variant, text, className, ...props}: Props) => {
  const classNames: {[key in typeof variant]: typeof className} = {
    h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
    h2: "scroll-m-16 text-3xl font-bold tracking-tight lg:text-4xl",
    h3: "scroll-m-12 text-2xl font-bold tracking-tight lg:text-3xl",
    h4: "scroll-m-10 text-xl font-bold tracking-tight lg:text-2xl",
    h5: "scroll-m-8 text-lg font-bold tracking-tight lg:text-xl",
    p: "scroll-m-20 text-base font-normal tracking-tight",
    span: "scroll-m-20 text-base font-normal tracking-tight",
  }

  const Tag = variant;
  const defaultClasses = classNames[variant]!;

  return (
    <Tag className={cn(defaultClasses, className)} {...props}>
      {text}
    </Tag>
  )
}

export default Typography