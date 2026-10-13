"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { api, ApiError } from "@/lib/api-client";
import { UserContext } from "@/types/api";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const fetchUserContext = async () => {
    try {
      setApiStatus("checking");
      setError(null);
      setRequiresLogin(false);
      const data = await api.getMe();
      setUserContext(data);
      setApiStatus("online");
      if (data.active_school_id && !localStorage.getItem("sms_active_school_id")) {
        localStorage.setItem("sms_active_school_id", data.active_school_id);
      }
    } catch (err: unknown) {
      console.error("Failed to load user context:", err);
      setApiStatus(err instanceof ApiError && err.status === 0 ? "offline" : "online");
      setRequiresLogin(err instanceof ApiError && err.status === 401);
      setError(err instanceof Error ? err.message : "Failed to load your school profile.");
    }
  };

  useEffect(() => {
    if (pathname === "/login") return;
    fetchUserContext();
  }, [pathname]);

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Responsive Sidebar */}
      <Sidebar
        userContext={userContext}
        isOpen={sidebarOpen}
        apiStatus={apiStatus}
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
                {requiresLogin ? (
                  <Link href="/login" className="rounded-md bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-700">Sign in</Link>
                ) : (
                  <button onClick={fetchUserContext} className="rounded-md bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-700">Retry</button>
                )}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
