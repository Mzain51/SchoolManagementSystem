"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Settings,
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Manage Students",
      description: "Roster and new admissions",
      href: "/students",
      icon: GraduationCap,
      color: "bg-blue-50 text-blue-700 hover:bg-blue-100/80 border-blue-200/60",
    },
    {
      title: "Academic setup",
      description: "Years, classes and subjects",
      href: "/academic-setup",
      icon: Settings,
      color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border-indigo-200/60",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Quick Operations</h3>
        <p className="text-xs text-slate-500">Fast shortcuts for daily administrative and teacher tasks</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xl">
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
