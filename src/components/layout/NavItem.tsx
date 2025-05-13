// src/components/layout/NavItem.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isMobile?: boolean;
}

export default function NavItem({ href, label, icon: Icon, isMobile = false }: NavItemProps) {
  const pathname = usePathname();
  // Exact match for homepage, startsWith for other pages to handle sub-routes.
  const isActive = href === '/' ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary-foreground/20 text-primary-foreground" 
          : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
        isMobile ? "w-full justify-start py-3 text-base" : "" 
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className={cn("h-5 w-5 mr-3", isMobile ? "text-primary-foreground/90" : "text-primary-foreground/90" )} />
      {label}
    </Link>
  );
}
