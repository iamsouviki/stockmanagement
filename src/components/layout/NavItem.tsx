"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as icons from 'lucide-react'; // Import all icons to lookup by string name
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  iconName?: keyof typeof icons; // Expect a string name of the icon
}

const NavItem: React.FC<NavItemProps> = ({ href, label, iconName }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  // Dynamically select the icon component based on the string name
  const IconComponent = iconName && icons[iconName] ? icons[iconName] : null;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "hover:bg-primary-foreground hover:text-primary",
        isActive ? "bg-primary-foreground text-primary shadow-sm" : "text-primary-foreground",
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
      {label}
    </Link>
  );
};

export default NavItem;
