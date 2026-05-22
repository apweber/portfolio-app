import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={`border-b border-gray-200 px-6 py-4 ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }: CardProps) {
  return <div className={`px-6 py-4 ${className}`} {...props} />;
}
