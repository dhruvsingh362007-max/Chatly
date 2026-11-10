import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Toast = () => {
  const { toast } = useParking();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-50',
    warning: 'border-amber-500/30 bg-amber-950/90 text-amber-50',
    error: 'border-rose-500/30 bg-rose-950/90 text-rose-50',
    info: 'border-blue-500/30 bg-navy-950/95 text-blue-50',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
          borders[toast.type] || borders.info
        } max-w-md`}
      >
        {icons[toast.type] || icons.info}
        <div className="text-sm font-medium pr-2">{toast.message}</div>
      </div>
    </div>
  );
};

