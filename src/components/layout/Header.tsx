// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import NavItem from './NavItem';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, Boxes, Receipt, History, Users, Tags, LogIn, LogOut, UserCog } from 'lucide-react'; 
import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation'; 
import { useState, useEffect } from 'react'; 
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types'; 

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[]; 
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: Home, roles: ['owner', 'admin', 'employee'] },
  { href: '/products', label: 'Products', icon: Boxes, roles: ['owner', 'admin', 'employee'] },
  { href: '/categories', label: 'Categories', icon: Tags, roles: ['owner', 'admin', 'employee'] },
  { href: '/billing', label: 'Billing', icon: Receipt, roles: ['owner', 'admin', 'employee'] },
  { href: '/orders', label: 'Orders', icon: History, roles: ['owner', 'admin', 'employee'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['owner', 'admin', 'employee'] },
  { href: '/settings/user-management', label: 'Manage Users', icon: UserCog, roles: ['owner', 'admin'] },
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
        // For logged-out users, only show links that don't have specific roles or adjust as needed
        // Currently, this logic means logged-out users would see all links unless roles are strictly enforced
        // A common pattern is to show only public links or a login link
        setVisibleNavLinks(navLinks.filter(link => !link.roles || link.href === '/login' || link.href === '/')); 
      }
    }
  }, [currentUser, userProfile, isLoading]);

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

          <nav className="hidden lg:flex items-center space-x-1"> {/* Changed md:flex to lg:flex */}
            {!isLoading && visibleNavLinks.map((link) => (
              <NavItem key={link.href} href={link.href} label={link.label} icon={link.icon} currentPathname={pathname}/>
            ))}
          </nav>

          <div className="hidden lg:flex items-center ml-2"> {/* Changed md:flex to lg:flex */}
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

          <div className="lg:hidden flex items-center"> {/* Changed md:hidden to lg:hidden */}
            {isLoading ? (
                 <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 sm:h-10 sm:w-10" disabled></Button> 
            ) : currentUser && ( 
              <Button variant="ghost" size="icon" onClick={logout} className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 sm:h-10 sm:w-10 mr-1">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="sr-only">Logout</span>
              </Button>
            ) 
            }
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
                  {!isLoading && (
                    <div className="mt-auto pt-4 border-t border-primary-foreground/20">
                      {currentUser ? (
                        <Button variant="ghost" size="sm" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/20">
                          <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/20">
                          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            <LogIn className="mr-2 h-4 w-4" /> Login
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

