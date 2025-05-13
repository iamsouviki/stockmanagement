// @ts-nocheck
"use client";

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import NavItem from './NavItem';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type * as LucideIcons from 'lucide-react'; 
import { Menu } from 'lucide-react';

const navLinks: Array<{ href: string; label: string; iconName: keyof typeof LucideIcons }> = [
  { href: '/', label: 'Dashboard', iconName: 'LayoutDashboard' },
  { href: '/products', label: 'Products', iconName: 'Boxes' },
  { href: '/categories', label: 'Categories', iconName: 'Tags' },
  { href: '/billing', label: 'Billing', iconName: 'Receipt' },
  { href: '/orders', label: 'Orders', iconName: 'History' }, 
  { href: '/customers', label: 'Customers', iconName: 'Users' },
];

const Header = () => {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center" aria-label="StockPilot Home">
            <Logo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavItem key={link.href} href={link.href} label={link.label} iconName={link.iconName} />
            ))}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] bg-primary p-4">
                <nav className="flex flex-col space-y-3 mt-6">
                  {navLinks.map((link) => (
                     <NavItem key={link.href} href={link.href} label={link.label} iconName={link.iconName} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
