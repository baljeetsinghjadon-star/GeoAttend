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
  ShieldAlert,
  History,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    if (role === "admin") {
      return [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Geofence Zones", href: "/admin/zones", icon: MapPin },
        { label: "Classes & Students", href: "/admin/classes", icon: BookOpen },
        { label: "Sessions", href: "/admin/sessions", icon: CalendarCheck },
        { label: "Reports & Export", href: "/admin/reports", icon: FileSpreadsheet },
        { label: "Security Audit Logs", href: "/admin/audit", icon: ShieldAlert },
      ];
    } else if (role === "teacher") {
      return [
        { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
        { label: "My Classes", href: "/teacher/classes", icon: BookOpen },
        { label: "Geofence Zones", href: "/teacher/zones", icon: MapPin },
        { label: "Sessions", href: "/teacher/sessions", icon: CalendarCheck },
        { label: "Attendance Reports", href: "/teacher/reports", icon: FileSpreadsheet },
      ];
    } else {
      return [
        { label: "Active Sessions", href: "/student", icon: CalendarCheck },
        { label: "Attendance History", href: "/student/history", icon: History },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 space-y-1">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {role === "admin"
          ? "Campus Admin Panel"
          : role === "teacher"
          ? "Instructor Portal"
          : "Student Workspace"}
      </div>

      <nav className="space-y-1 pt-1">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
