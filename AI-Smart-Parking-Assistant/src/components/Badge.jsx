import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'Under Dispute':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/20';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-500';
      case 'Under Dispute':
        return 'bg-indigo-500 animate-pulse';
      case 'Overdue':
        return 'bg-rose-500';
      case 'Pending':
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs ${getBadgeStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {status}
    </span>
  );
};

export const AIMeritBadge = ({ verdict, confidence }) => {
  const isHigh = confidence >= 80;
  const isModerate = confidence >= 50 && confidence < 80;

  const style = isHigh
    ? 'bg-blue-900/10 text-navy-800 border-navy-300'
    : isModerate
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>
      <span className="font-semibold">{confidence}% AI Confidence</span>
      <span className="text-slate-400">•</span>
      <span>{verdict}</span>
    </div>
  );
};

