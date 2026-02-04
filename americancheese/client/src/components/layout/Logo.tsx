import React from "react";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Code brackets with lightning bolt */}
      <path d="M7 7L3 12L7 17" />
      <path d="M17 7L21 12L17 17" />
      <path d="M14 8L10 12.5H14L10 17" />
    </svg>
  );
}