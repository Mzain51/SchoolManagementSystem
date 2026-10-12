"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendPoint } from "@/types/api";
import { formatPKR } from "@/lib/utils";

interface FeeChartProps {
  data: TrendPoint[];
}

export function FeeChart({ data }: FeeChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Fee Collection vs Invoiced</h3>
          <p className="text-xs text-slate-500">Monthly financial performance (PKR)</p>
        </div>
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Currency: PKR (Rs.)
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: any, name: any) => [
                formatPKR(Number(value)),
                name === "value" ? "Collected" : "Invoiced",
              ]}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "0.75rem",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              formatter={(value) => (value === "value" ? "Collected" : "Invoiced")}
            />
            <Bar dataKey="secondary_value" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
