import * as React from "react";

export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border bg-white shadow-sm ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={`p-4 pb-0 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={`font-semibold leading-none tracking-tight ${className || ""}`} {...props}>
      {children}
    </h3>
  );
}

export interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={`p-4 pt-0 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}