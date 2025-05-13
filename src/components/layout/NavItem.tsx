// src/components/layout/NavItem.tsx
"use client";

import Link from 'next/link';
// import { usePathname } from 'next/navigation'; // No longer needed here directly
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isMobile?: boolean;
  currentPathname: string; // Receive current pathname as a prop
  onClick?: () => void; // Optional onClick for mobile menu item to close sheet
}

export default function NavItem({ href, label, icon: Icon, isMobile = false, currentPathname, onClick }: NavItemProps) {
  // const pathname = usePathname(); // Use passed prop instead
  // Exact match for homepage, startsWith for other pages to handle sub-routes.
  const isActive = href === '/' ? currentPathname === href : currentPathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors",
        isActive
          ? "bg-primary-foreground/20 text-primary-foreground" 
          : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
        isMobile ? "w-full justify-start py-2.5 sm:py-3 text-sm sm:text-base" : "" 
      )}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick} // Add onClick handler
    >
      <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3", isMobile ? "text-primary-foreground/90" : "text-primary-foreground/90" )} />
      {label}
    </Link>
  );
}
