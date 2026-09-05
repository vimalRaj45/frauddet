import React from 'react';

export default function StatCards({ stats }) {
  const cards = [
    {
      title: "Total Transactions",
      value: stats?.total_transactions ?? 0,
      icon: "bi-activity",
      subtext: `Volume: $${(stats?.total_volume_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: "Processed",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      topBorder: "border-t-4 border-t-blue-600"
    },
    {
      title: "Normal (Passed)",
      value: stats?.normal_count ?? 0,
      icon: "bi-check-circle-fill",
      subtext: "Score 0–39 (transactions table)",
      badge: stats?.total_transactions ? `${Math.round(((stats.normal_count || 0) / stats.total_transactions) * 100)}%` : "0%",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      topBorder: "border-t-4 border-t-emerald-500"
    },
    {
      title: "Suspicious Flagged",
      value: stats?.suspicious_count ?? 0,
      icon: "bi-exclamation-triangle-fill",
      subtext: "Score 40–69 (Review required)",
      badge: "Medium Risk",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      topBorder: "border-t-4 border-t-amber-500"
    },
    {
      title: "Fraud Blocked",
      value: stats?.fraud_count ?? 0,
      icon: "bi-shield-x",
      subtext: `Blocked: $${(stats?.flagged_volume_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      badge: "Score 70+",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      topBorder: "border-t-4 border-t-rose-500"
    },
    {
      title: "Avg Risk / Fraud Rate",
      value: `${stats?.average_risk_score ?? 0}/100`,
      icon: "bi-speedometer2",
      subtext: `Fraud Rate: ${stats?.fraud_rate_percentage ?? 0}%`,
      badge: stats?.fraud_rate_percentage > 15 ? "Elevated" : "Normal",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      topBorder: "border-t-4 border-t-indigo-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${card.topBorder}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${card.iconBg}`}>
              <i className={`bi ${card.icon}`}></i>
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500 truncate">
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}
