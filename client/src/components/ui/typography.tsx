import React from "react";
import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function TypographyH1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn("font-heading scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-gray-800 leading-tight", className)}>
      {children}
    </h1>
  );
}

export function TypographyH2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("font-heading scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 text-gray-800 leading-tight", className)}>
      {children}
    </h2>
  );
}

export function TypographyH3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("font-heading scroll-m-20 text-2xl font-semibold tracking-tight text-gray-800 leading-snug", className)}>
      {children}
    </h3>
  );
}

export function TypographyH4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn("font-heading scroll-m-20 text-xl font-medium tracking-tight text-gray-800 leading-snug", className)}>
      {children}
    </h4>
  );
}

export function TypographyP({ children, className }: TypographyProps) {
  return (
    <p className={cn("leading-7 text-gray-600 [&:not(:first-child)]:mt-4", className)}>
      {children}
    </p>
  );
}

export function TypographyLead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-xl text-gray-500 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function TypographySubtle({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm text-gray-500 leading-normal", className)}>
      {children}
    </p>
  );
}

export function TypographyLabel({ children, className }: TypographyProps) {
  return (
    <span className={cn("text-xs font-medium text-gray-500 uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}

export function TypographyLarge({ children, className }: TypographyProps) {
  return (
    <div className={cn("text-lg font-semibold", className)}>
      {children}
    </div>
  );
}

export function TypographySmall({ children, className }: TypographyProps) {
  return (
    <small className={cn("text-sm font-medium leading-none", className)}>
      {children}
    </small>
  );
}

export function TypographyMuted({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function TypographyCode({ children, className }: TypographyProps) {
  return (
    <code className={cn("font-mono relative rounded bg-muted px-[0.3rem] py-[0.2rem] text-sm", className)}>
      {children}
    </code>
  );
}