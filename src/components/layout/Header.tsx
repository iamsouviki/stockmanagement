// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import NavItem from './NavItem';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, Boxes, Receipt, History, Users, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation'; 
import { useState } from 'react'; 

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
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link 
            href="/" 
            className="flex items-center cursor-pointer" 
            aria-label="PAS Trading CO Home"
          >
            <Logo className="h-7 sm:h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavItem key={link.href} href={link.href} label={link.label} icon={link.icon} currentPathname={pathname}/>
            ))}
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 sm:h-10 sm:w-10">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[220px] sm:w-[250px] bg-primary p-3 pt-6 sm:p-4 sm:pt-8">
                <div className="mb-4 sm:mb-6">
                   <Link 
                    href="/" 
                    className="flex items-center cursor-pointer" 
                    aria-label="PAS Trading CO Home" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                      <Logo className="h-7 sm:h-8 w-auto" />
                  </Link>
                </div>
                <nav className="flex flex-col space-y-1.5 sm:space-y-2">
                  {navLinks.map((link) => (
                     <SheetTrigger asChild key={link.href}>
                        <NavItem href={link.href} label={link.label} icon={link.icon} isMobile currentPathname={pathname} onClick={() => setIsMobileMenuOpen(false)}/>
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
