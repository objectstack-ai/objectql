import { useId, type SVGProps } from 'react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '');
  const gradientId = `objectql-gradient-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="256"
          y2="256"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      
      {/* Background Shape: Soft Hexagon */}
      <path
        d="M128 24L224 80V176L128 232L32 176V80L128 24Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.1"
      />

      {/* Main Structure: Abstract QL Node */}
      <path
        d="M128 56L200 96V166L128 206L56 166V96L128 56Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Center Detail: Core */}
      <path
        d="M128 96V166"
        stroke={`url(#${gradientId})`}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M96 116L160 146"
        stroke={`url(#${gradientId})`}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function Logo(props: { className?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <LogoIcon className="size-7" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              ObjectQL
            </span>
        </div>
    );
}
