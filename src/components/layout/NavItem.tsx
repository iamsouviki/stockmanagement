// @ts-nocheck
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  iconName?: keyof typeof icons; 
}

const NavItem: React.FC<NavItemProps> = ({ href, label, iconName }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  const IconComponent = iconName ? icons[iconName] : null;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "hover:bg-primary-foreground hover:text-primary", // Default hover for mobile (on primary bg)
        isActive ? "bg-primary-foreground text-primary shadow-sm" : "text-primary-foreground", // Default active for mobile & base text for desktop
        // Desktop specific styles can be added here if they differ significantly beyond color inversion
        // For example, if desktop active/hover should use accent colors:
        // "md:hover:bg-accent md:hover:text-accent-foreground",
        // isActive ? "md:bg-accent md:text-accent-foreground" : "md:text-primary-foreground"
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
      {label}
    </Link>
  );
};

export default NavItem;
