import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 50"
    width="120"
    height="30"
    role="img"
    aria-label="StockPilot Logo"
    {...props}
  >
    <rect width="200" height="50" fill="transparent" />
    <path d="M10 10 L10 40 L25 40 L25 25 L40 25 L40 40 L55 40 L55 10 Z" fill="hsl(var(--primary))" />
    <path d="M25 10 L40 10 L40 25 L25 25 Z" fill="hsl(var(--accent))" />
    <text
      x="65"
      y="35"
      fontFamily="var(--font-geist-sans), Arial, sans-serif"
      fontSize="30"
      fontWeight="bold"
      fill="hsl(var(--foreground))"
    >
      StockPilot
    </text>
  </svg>
);

export default Logo;
