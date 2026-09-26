import React from 'react';
import { Card, CardContent } from "@/components/elements/Card";

export default function AdminStatCard({ title, value, percentage, trend, progressColor = "bg-teal-500" }) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${trend === 'down' ? 'text-red-500' : 'text-teal-600'}`}>
              {trend === 'down' ? '↓' : '↑'}
            </span>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          </div>
          <span className="text-xs text-gray-400">{percentage}%</span>
        </div>

        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${progressColor} transition-all duration-500`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}