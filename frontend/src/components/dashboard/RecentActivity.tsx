"use client";

import React from "react";
import { Activity, Bell, Clock, ShieldCheck } from "lucide-react";
import { ActivityItem, NoticeItem } from "@/types/api";
import { formatDate } from "@/lib/utils";

interface RecentActivityProps {
  activities: ActivityItem[];
  notices: NoticeItem[];
}

export function RecentActivity({ activities, notices }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Audit Log Activity */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Operational Activity</h3>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Live Audit Trail</span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {activities.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No activity logged yet.</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-start justify-between py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{act.action}</p>
                    <p className="text-[11px] text-slate-500">{act.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By {act.user_name || "System"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Notices */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Notices & Circulars</h3>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Active Board</span>
        </div>

        <div className="mt-4 space-y-3">
          {notices.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No active notices.</p>
          ) : (
            notices.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-3.5 transition ${
                  n.is_urgent
                    ? "border-rose-200 bg-rose-50/50"
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      n.is_urgent ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {n.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(n.date)}</span>
                </div>
                <h4 className="mt-2 text-xs font-bold text-slate-900 leading-snug">{n.title}</h4>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
