"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  icon?: LucideIcon;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon: Icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} legacyBehavior passHref>
      <a
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "hover:bg-primary-foreground hover:text-primary",
          isActive ? "bg-primary-foreground text-primary shadow-sm" : "text-primary-foreground",
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        {label}
      </a>
    </Link>
  );
};

export default NavItem;
