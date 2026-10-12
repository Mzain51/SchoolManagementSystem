"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { api } from "@/lib/api-client";
import { UserContext } from "@/types/api";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserContext = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMe();
      setUserContext(data);
      if (data.active_school_id && !localStorage.getItem("sms_active_school_id")) {
        localStorage.setItem("sms_active_school_id", data.active_school_id);
      }
    } catch (err: any) {
      console.error("Failed to load user context:", err);
      setError(err.message || "Failed to connect to school backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserContext();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Responsive Sidebar */}
      <Sidebar
        userContext={userContext}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userContext={userContext}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRefresh={fetchUserContext}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">Backend Connection Notice: </span>
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchUserContext}
                  className="rounded-md bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
