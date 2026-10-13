"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  UserPlus,
  Layers,
  BookOpen,
  CalendarDays,
  Clock,
  ClipboardCheck,
  UserCheck,
  BarChart3,
  FileSpreadsheet,
  Edit3,
  Award,
  Wallet,
  Receipt,
  CreditCard,
  AlertCircle,
  FileText,
  BookMarked,
  Home,
  Megaphone,
  Users2,
  ShieldAlert,
  Settings,
  History,
  ChevronDown,
  ChevronRight,
  School as SchoolIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserContext } from "@/types/api";

interface SidebarProps {
  userContext: UserContext | null;
  isOpen: boolean;
  apiStatus: "checking" | "online" | "offline";
  onClose?: () => void;
}

interface NavSection {
  title: string;
  roles?: string[];
  items: {
    title: string;
    href: string;
    icon: any;
    roles?: string[];
    badge?: string;
  }[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Academic Management",
    roles: ["admin", "teacher"],
    items: [
      { title: "Students", href: "/students", icon: GraduationCap },
      { title: "Admissions", href: "/admissions", icon: UserPlus, roles: ["admin"] },
      { title: "Classes & Sections", href: "/academic-setup#classes", icon: Layers, roles: ["admin"] },
      { title: "Subjects", href: "/academic-setup#subjects", icon: BookOpen, roles: ["admin"] },
      { title: "Academic Years", href: "/academic-setup#years", icon: CalendarDays, roles: ["admin"] },
      { title: "Academic Setup", href: "/academic-setup", icon: Settings, roles: ["admin"] },
      { title: "Timetable", href: "/timetable", icon: Clock },
    ],
  },
  {
    title: "Attendance",
    roles: ["admin", "teacher", "accountant"],
    items: [
      { title: "Student Attendance", href: "/attendance/students", icon: ClipboardCheck },
      { title: "Teacher & Staff", href: "/attendance/staff", icon: UserCheck, roles: ["admin"] },
      { title: "Attendance Reports", href: "/attendance/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Examinations",
    roles: ["admin", "teacher"],
    items: [
      { title: "Examinations", href: "/exams", icon: FileSpreadsheet },
      { title: "Marks Entry", href: "/exams/marks", icon: Edit3 },
      { title: "Results & Cards", href: "/exams/results", icon: Award },
    ],
  },
  {
    title: "Finance",
    roles: ["admin", "accountant"],
    items: [
      { title: "Fee Structures", href: "/finance/structures", icon: Wallet, roles: ["admin"] },
      { title: "Invoices & Vouchers", href: "/finance/invoices", icon: Receipt },
      { title: "Record Payment", href: "/finance/payments", icon: CreditCard },
      { title: "Outstanding Dues", href: "/finance/dues", icon: AlertCircle, badge: "PKR" },
      { title: "Fee Reports", href: "/finance/reports", icon: FileText },
    ],
  },
  {
    title: "Teaching",
    roles: ["admin", "teacher"],
    items: [
      { title: "Syllabus Coverage", href: "/syllabus", icon: BookMarked },
      { title: "Homework", href: "/homework", icon: Home },
    ],
  },
  {
    title: "Communication",
    items: [
      { title: "Announcements", href: "/announcements", icon: Megaphone },
      { title: "Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Administration",
    roles: ["admin"],
    items: [
      { title: "Teachers & Staff", href: "/staff", icon: Users2 },
      { title: "Users & Roles", href: "/users", icon: ShieldAlert },
      { title: "School Settings", href: "/settings", icon: Settings },
      { title: "Audit Logs", href: "/audit-logs", icon: History },
    ],
  },
];

const implementedRoutes = new Set(["/", "/students", "/academic-setup", "/academic-setup#classes", "/academic-setup#years", "/academic-setup#subjects"]);

export function Sidebar({ userContext, isOpen, apiStatus }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = userContext?.active_role || (userContext?.is_superadmin ? "admin" : "admin");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Academic Management": true,
    "Finance": true,
    "Attendance": true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col shadow-sm",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <SchoolIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Pakistan SMS</h1>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">School Management System</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationConfig.map((section) => {
          // Check role restrictions on section
          if (section.roles && !section.roles.includes(currentRole) && !userContext?.is_superadmin) {
            return null;
          }

          const visibleItems = section.items.filter((item) => {
            const hasRole = !item.roles || item.roles.includes(currentRole) || userContext?.is_superadmin;
            return hasRole && implementedRoutes.has(item.href);
          });
          if (visibleItems.length === 0) return null;

          const isCollapsible = visibleItems.length > 2;
          const isSectionOpen = openSections[section.title] ?? true;

          return (
            <div key={section.title} className="space-y-1">
              <div
                onClick={() => isCollapsible && toggleSection(section.title)}
                className={cn(
                  "flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none",
                  isCollapsible && "cursor-pointer hover:text-slate-600"
                )}
              >
                <span>{section.title}</span>
                {isCollapsible && (
                  isSectionOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                )}
              </div>

              {isSectionOpen && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href.split("#")[0];
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                          isActive
                            ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            )}
                          />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50">
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", apiStatus === "online" ? "bg-emerald-500" : apiStatus === "offline" ? "bg-rose-500" : "bg-amber-400 animate-pulse")}></span>
            <span>{apiStatus === "online" ? "API Online" : apiStatus === "offline" ? "API Offline" : "Checking API"}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">PKT UTC+5</span>
        </div>
      </div>
    </aside>
  );
}
