"use client";

import React, { useEffect, useState } from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { FeeChart } from "@/components/dashboard/FeeChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { api } from "@/lib/api-client";
import { DashboardStatsResponse } from "@/types/api";
import { Calendar, Building2, MapPin, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const todayFormatted = new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date());

  if (loading && !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-medium text-slate-500">Loading school records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {stats?.school_name || "Campus Dashboard"}
            </h1>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
              Active Session 2026-2027
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {todayFormatted} (Asia/Karachi)
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Currency: {stats?.currency || "PKR"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Operational Mode: Academic
          </span>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <StatCards stats={stats} />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Analytical Trends: Attendance and Fees */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendanceChart data={stats?.attendance_trend || []} />
        <FeeChart data={stats?.fee_collection_trend || []} />
      </div>

      {/* Live Activity & School Circulars */}
      <RecentActivity
        activities={stats?.recent_activities || []}
        notices={stats?.recent_notices || []}
      />
    </div>
  );
}
