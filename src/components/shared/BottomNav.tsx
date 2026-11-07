"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";
import {
  LayoutDashboard,
  MapPin,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  History,
} from "lucide-react";

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    if (role === "admin") {
      return [
        { label: "Home", href: "/admin", icon: LayoutDashboard },
        { label: "Zones", href: "/admin/zones", icon: MapPin },
        { label: "Classes", href: "/admin/classes", icon: BookOpen },
        { label: "Sessions", href: "/admin/sessions", icon: CalendarCheck },
        { label: "Reports", href: "/admin/reports", icon: FileSpreadsheet },
      ];
    } else if (role === "teacher") {
      return [
        { label: "Home", href: "/teacher", icon: LayoutDashboard },
        { label: "Classes", href: "/teacher/classes", icon: BookOpen },
        { label: "Zones", href: "/teacher/zones", icon: MapPin },
        { label: "Sessions", href: "/teacher/sessions", icon: CalendarCheck },
        { label: "Reports", href: "/teacher/reports", icon: FileSpreadsheet },
      ];
    } else {
      return [
        { label: "Mark Attendance", href: "/student", icon: CalendarCheck },
        { label: "History & Stats", href: "/student/history", icon: History },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-xl mb-0.5 transition-all",
                  isActive && "bg-blue-50 dark:bg-blue-950/60"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="truncate max-w-[70px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
