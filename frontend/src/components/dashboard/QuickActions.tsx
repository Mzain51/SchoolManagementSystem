"use client";

import React from "react";
import Link from "next/link";
import {
  UserPlus,
  ClipboardCheck,
  CreditCard,
  FileSpreadsheet,
  Edit3,
  Megaphone,
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Register Student",
      description: "New admission intake",
      href: "/admissions",
      icon: UserPlus,
      color: "bg-blue-50 text-blue-700 hover:bg-blue-100/80 border-blue-200/60",
    },
    {
      title: "Take Attendance",
      description: "Daily class register",
      href: "/attendance/students",
      icon: ClipboardCheck,
      color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200/60",
    },
    {
      title: "Record Fee Payment",
      description: "Cash/Bank receipt voucher",
      href: "/finance/payments",
      icon: CreditCard,
      color: "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border-amber-200/60",
    },
    {
      title: "Create Examination",
      description: "Terminal / Midterm exams",
      href: "/exams",
      icon: FileSpreadsheet,
      color: "bg-purple-50 text-purple-700 hover:bg-purple-100/80 border-purple-200/60",
    },
    {
      title: "Enter Exam Marks",
      description: "Subject teacher entry",
      href: "/exams/marks",
      icon: Edit3,
      color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border-indigo-200/60",
    },
    {
      title: "Post Announcement",
      description: "School notice or holiday",
      href: "/announcements",
      icon: Megaphone,
      color: "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border-rose-200/60",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Quick Operations</h3>
        <p className="text-xs text-slate-500">Fast shortcuts for daily administrative and teacher tasks</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Link
              key={i}
              href={act.href}
              className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all duration-150 ${act.color}`}
            >
              <Icon className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-semibold leading-tight">{act.title}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{act.description}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
