"use client";

import React from "react";
import { Users, ClipboardCheck, Wallet, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { DashboardStatsResponse } from "@/types/api";

interface StatCardsProps {
  stats: DashboardStatsResponse | null;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: "Total Active Students",
      value: stats ? stats.total_students.toLocaleString() : "--",
      subtitle: `${stats?.total_classes || 0} Classes across ${stats?.total_sections || 0} Sections`,
      icon: Users,
      color: "blue",
      badge: "Enrolled",
    },
    {
      title: "Student Attendance Today",
      value: stats ? `${stats.student_attendance_percentage.toFixed(1)}%` : "--",
      subtitle: `${stats?.students_present_today || 0} Present • ${stats?.students_absent_today || 0} Absent`,
      icon: ClipboardCheck,
      color: "emerald",
      badge: "Real-time",
    },
    {
      title: "Today's Fee Collection",
      value: stats ? formatPKR(stats.today_fee_collection) : "--",
      subtitle: `Month: ${formatPKR(stats?.month_fee_collection || 0)}`,
      icon: Wallet,
      color: "indigo",
      badge: "PKR Cash/Bank",
    },
    {
      title: "Outstanding Fee Balance",
      value: stats ? formatPKR(stats.total_outstanding_balance) : "--",
      subtitle: `${stats?.overdue_students_count || 0} Students with Overdue Fees`,
      icon: AlertCircle,
      color: "rose",
      badge: "Due Ledgers",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  c.color === "blue"
                    ? "bg-blue-50 text-blue-600"
                    : c.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600"
                    : c.color === "indigo"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {c.value}
              </h3>
              <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
                <span>{c.subtitle}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {c.badge}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
