import type { SVGProps } from 'react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      {...props}
    >
      <rect width="256" height="256" fill="none" />
      <path
        d="M16 104l112 64l112-64l-112-64L16 104z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 136l112 64l112-64"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 168l112 64l112-64"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo(props: { className?: string }) {
    return (
        <div className="flex items-center gap-2">
            <LogoIcon className="size-6" />
            <span className="font-bold text-lg">ObjectQL</span>
        </div>
    );
}
