// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import NavItem from './NavItem';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, Boxes, Receipt, History, Users, Tags, LogIn, LogOut, SettingsIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation'; 
import { useState, useEffect } from 'react'; 
import { useAuth } from '@/hooks/useAuth';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: ('owner' | 'employee')[];
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Boxes, roles: ['owner', 'employee'] },
  { href: '/categories', label: 'Categories', icon: Tags, roles: ['owner', 'employee'] },
  { href: '/billing', label: 'Billing', icon: Receipt, roles: ['owner', 'employee'] },
  { href: '/orders', label: 'Orders', icon: History, roles: ['owner', 'employee'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['owner', 'employee'] },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['owner'] },
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, userProfile, logout, isLoading } = useAuth();

  const [visibleNavLinks, setVisibleNavLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (currentUser && userProfile) {
        setVisibleNavLinks(
          navLinks.filter(link => 
            !link.roles || link.roles.includes(userProfile.role)
          )
        );
      } else {
        // For non-logged-in users, only show links that don't require roles
        // or specific public links. Currently, this will effectively hide most links
        // if they all have role restrictions. The login button will be the primary CTA.
        setVisibleNavLinks(navLinks.filter(link => !link.roles));
      }
    }
  }, [currentUser, userProfile, isLoading]);

  // Do not render header on the login page
  if (pathname === '/login') {
    return null;
  }

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
            {!isLoading && visibleNavLinks.map((link) => (
              <NavItem key={link.href} href={link.href} label={link.label} icon={link.icon} currentPathname={pathname}/>
            ))}
          </nav>

          {/* Auth Button Desktop */}
          <div className="hidden md:flex items-center ml-2">
            {isLoading ? (
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20" disabled>Loading...</Button>
            ) : currentUser ? (
              <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary-foreground/20">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/20">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </div>


          {/* Mobile Navigation Trigger */}
          <div className="md:hidden flex items-center">
            {isLoading ? (
                 <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 sm:h-10 sm:w-10" disabled></Button> 
            ) : currentUser ? (
              <Button variant="ghost" size="icon" onClick={logout} className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 sm:h-10 sm:w-10 mr-1">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="sr-only">Logout</span>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 sm:h-10 sm:w-10 mr-1">
                <Link href="/login">
                  <LogIn className="h-5 w-5 sm:h-6 sm:w-6" />
                   <span className="sr-only">Login</span>
                </Link>
              </Button>
            )}
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
                  {!isLoading && visibleNavLinks.map((link) => (
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
