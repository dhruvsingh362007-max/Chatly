import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'navy',
  badge = null
}) => {
  const iconColorMap = {
    navy: 'text-navy-800 bg-slate-100',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    rose: 'text-rose-600 bg-rose-50',
    cyan: 'text-cyan-600 bg-cyan-50'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconColorMap[color] || iconColorMap.navy} transition-transform group-hover:scale-110 duration-150`}>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            {value}
          </h3>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
