import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 230 50" // Adjusted viewBox for potentially longer text
    // width and height are typically controlled by className where this component is used
    role="img"
    aria-label="PAS Trading CO Logo"
    {...props}
  >
    {/* Transparent background, useful if you want to ensure no default SVG background appears */}
    {/* <rect width="230" height="50" fill="transparent" /> */}
    <text
      x="0" // Start text from the left edge of the viewBox
      y="35" // Adjusted for vertical centering; depends on font and viewBox
      fontFamily="var(--font-geist-sans), Arial, sans-serif"
      fontSize="26" // Adjusted font size
      fontWeight="bold"
      fill="hsl(var(--primary-foreground))" // Ensure text is visible on primary background
    >
      PAS Trading CO
    </text>
  </svg>
);

export default Logo;
