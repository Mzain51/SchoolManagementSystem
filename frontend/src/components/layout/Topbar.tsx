"use client";

import React, { useState } from "react";
import {
  Menu,
  School as SchoolIcon,
  Bell,
  ChevronDown,
  User,
  Shield,
  LogOut,
  RefreshCw,
  Search,
} from "lucide-react";
import { UserContext, School } from "@/types/api";

interface TopbarProps {
  userContext: UserContext | null;
  onToggleSidebar: () => void;
  onRefresh: () => void;
}

export function Topbar({ userContext, onToggleSidebar, onRefresh }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSchoolOpen, setIsSchoolOpen] = useState(false);

  const activeSchool = userContext?.available_schools.find(
    (s) => s.id === userContext.active_school_id
  ) || userContext?.available_schools[0];

  const handleSwitchSchool = (schoolId: string) => {
    localStorage.setItem("sms_active_school_id", schoolId);
    setIsSchoolOpen(false);
    window.location.reload();
  };

  const handleSwitchDevRole = (role: string) => {
    localStorage.setItem("sms_auth_token", `dev-token-${role}`);
    setIsProfileOpen(false);
    window.location.reload();
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "teacher":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "accountant":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Toggle & School Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* School Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSchoolOpen(!isSchoolOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-100 transition"
          >
            <SchoolIcon className="h-4 w-4 text-blue-600" />
            <span className="max-w-[160px] truncate sm:max-w-xs">
              {activeSchool ? activeSchool.name : "Selecting School..."}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isSchoolOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                School Campuses
              </div>
              {userContext?.available_schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSwitchSchool(school.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    school.id === userContext.active_school_id
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{school.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{school.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Quick Search Bar */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search admission no, student, voucher..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh Backend Data */}
        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600"></span>
        </button>

        {/* User Role Pill */}
        <div className="hidden sm:block">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getRoleBadgeColor(
              userContext?.active_role
            )}`}
          >
            {userContext?.active_role || "Administrator"}
          </span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
              {userContext?.full_name ? userContext.full_name[0].toUpperCase() : "U"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {userContext?.full_name || "User"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {userContext?.email || "user@schools.pk"}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-800">{userContext?.full_name}</p>
                <p className="text-[11px] text-slate-500">{userContext?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Shield className="h-3 w-3 text-emerald-600" />
                  <span>Authenticated via Supabase</span>
                </div>
              </div>

              {/* Dev Role Switcher for instant testing */}
              <div className="py-2 border-b border-slate-100">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role (Testing)
                </div>
                <div className="mt-1 space-y-0.5">
                  <button
                    onClick={() => handleSwitchDevRole("admin")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <span>Principal / Admin</span>
                    <span className="text-[10px] text-purple-600 font-medium">Full Access</span>
                  </button>
                  <button
                    onClick={() => handleSwitchDevRole("teacher")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <span>Class Teacher</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Marks & Register</span>
                  </button>
                  <button
                    onClick={() => handleSwitchDevRole("accountant")}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <span>School Accountant</span>
                    <span className="text-[10px] text-amber-600 font-medium">Fees & Cash Vouchers</span>
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    localStorage.removeItem("sms_auth_token");
                    localStorage.removeItem("sms_active_school_id");
                    window.location.reload();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
