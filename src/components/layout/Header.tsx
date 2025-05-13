// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import NavItem from './NavItem';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, Boxes, Receipt, History, Users, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Boxes },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/orders', label: 'Orders', icon: History },
  { href: '/customers', label: 'Customers', icon: Users },
];

export default function Header() {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer" aria-label="StockPilot Home">
              <Logo className="h-8 w-auto" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavItem key={link.href} href={link.href} label={link.label} icon={link.icon} />
            ))}
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] bg-primary p-4 pt-8">
                <div className="mb-6">
                   <Link href="/">
                    <div className="flex items-center cursor-pointer" aria-label="StockPilot Home">
                      <Logo className="h-8 w-auto" />
                    </div>
                  </Link>
                </div>
                <nav className="flex flex-col space-y-2">
                  {navLinks.map((link) => (
                     <SheetTrigger asChild key={link.href}>
                        <NavItem href={link.href} label={link.label} icon={link.icon} isMobile />
                     </SheetTrigger>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
