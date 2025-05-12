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
    <Link href={href} legacyBehavior passHref>
      <a
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "hover:bg-primary-foreground hover:text-primary",
          isActive ? "bg-primary-foreground text-primary shadow-sm" : "text-primary-foreground",
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
        {label}
      </a>
    </Link>
  );
};

export default NavItem;
