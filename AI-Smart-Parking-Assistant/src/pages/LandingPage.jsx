import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  ShieldCheck,
  Bot,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Zap,
  MapPin,
  Clock,
  Camera,
  Activity,
  CreditCard,
  PlusCircle,
  RefreshCw,
  Server,
  AlertCircle
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/Badge';
import { getAdminOverview, getViolations } from '../services/api';

export const LandingPage = () => {
  const {
    navigateTo,
    setSelectedViolationId,
    loginAs,
    user
  } = useParking();

  // Live REST API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [liveViolations, setLiveViolations] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrent fetch from Flask REST API endpoints
      const [overviewData, violationsData] = await Promise.all([
        getAdminOverview(),
        getViolations()
      ]);

      setOverview(overviewData.overview || null);
      setLiveViolations(violationsData.violations || []);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching dashboard data from Flask REST API:', err);
      setError(err.message || 'Unable to connect to Flask backend at http://127.0.0.1:5000');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Aggregate metrics derived directly from Flask backend API responses
  const totalViolations = overview?.violations?.total ?? liveViolations.length;
  const pendingCount = overview?.violations?.pending ?? 0;
  const underDisputeCount = overview?.violations?.under_dispute ?? 0;
  const pendingReview = pendingCount + underDisputeCount;
  const resolvedCount = overview?.violations?.resolved ?? 0;
  const activeRulesCount = overview?.rules?.active ?? 0;
  const totalRulesCount = overview?.rules?.total ?? 0;
  const pendingFineAmount = overview?.financials?.total_fines_outstanding_inr ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">Dashboard</h1>
            {/* Live Backend Connection Indicator */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                error
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title={error ? error : 'Connected to Flask REST API at http://127.0.0.1:5000'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  error ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {error ? 'Flask API Offline' : 'Live REST API Connected'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time municipal parking compliance monitoring, automated violation ledger and explainable AI benchmarks.
            {lastUpdated && (
              <span className="ml-1.5 text-slate-400">
                • Refreshed at {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Data Button */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh data from Flask backend"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => navigateTo('ai-assistant')}
            className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Launch AI Copilot</span>
          </button>

          <button
            onClick={() => navigateTo('report')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Violation</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900">Backend Connection Notice</p>
              <p className="text-xs text-rose-700 mt-0.5">
                Could not retrieve live data from Flask server: <span className="font-mono text-[11px]">{error}</span>.
                Make sure Flask is running on <span className="font-mono font-semibold">http://127.0.0.1:5000</span>.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Violations"
          value={loading ? '...' : totalViolations}
          subtitle={loading ? 'Loading...' : `${totalViolations} citations in SQLite`}
          icon={AlertTriangle}
          color="navy"
        />

        <StatCard
          title="Pending Review"
          value={loading ? '...' : pendingReview}
          subtitle={loading ? 'Loading...' : `₹${pendingFineAmount.toLocaleString('en-IN')} outstanding`}
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="Approved / Waived"
          value={loading ? '...' : resolvedCount}
          subtitle={loading ? 'Loading...' : `${resolvedCount} resolved in SQLite`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Active Appeals"
          value={loading ? '...' : underDisputeCount}
          subtitle={loading ? 'Loading...' : `${underDisputeCount} under dispute`}
          icon={Scale}
          color="indigo"
        />

        <StatCard
          title="Active Zones"
          value={loading ? '...' : `${activeRulesCount}/${totalRulesCount || 5}`}
          subtitle={loading ? 'Loading...' : 'Monitored corridors'}
          icon={Camera}
          color="blue"
        />

        <StatCard
          title="Sample AI Score"
          value="High"
          subtitle="Simulated diagnostic"
          icon={Sparkles}
          color="cyan"
        />
      </div>

      {/* Full-Width: Recent Citations & Activity Ledger */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy-900">Recent Citations & Activity</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                SQLite Live Ledger
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Latest monitored infractions fetched from backend REST API across active enforcement zones.
            </p>
          </div>
          <button
            onClick={() => navigateTo('dashboard')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-3 bg-slate-200 rounded" />
                    <div className="w-48 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && liveViolations.length === 0 && !error && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy-900">No Violations Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              The SQLite database reports zero active citations. Monitored corridors are compliant.
            </p>
          </div>
        )}

        {/* Live Records List */}
        {!loading && liveViolations.length > 0 && (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {liveViolations.slice(0, 4).map((v) => {
              const fine = parseFloat(v.fine_amount ?? v.fineAmount ?? 0);
              const late = parseFloat(v.late_fee ?? v.lateFee ?? 0);
              const totalDue = fine + late;
              const plate = v.vehicle_plate || v.vehiclePlate || 'UNKNOWN';
              const issueDate = v.issue_date || v.issueDate || 'Recent';

              return (
                <div
                  key={v.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Car className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy-900">{v.id}</span>
                        <span className="font-mono text-[11px] px-2 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {plate}
                        </span>
                        <StatusBadge status={v.status} />
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">{v.type}</p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{v.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-black text-navy-900">
                        ₹{totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-slate-400">{issueDate}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedViolationId(v.id);
                        navigateTo('details', { violationId: v.id });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-5">
          <span>
            Showing {Math.min(4, liveViolations.length)} of {totalViolations} live citations from SQLite
          </span>
          <button
            onClick={() => navigateTo('dashboard')}
            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Manage in Driver Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full-Width Row: System Status Section (BELOW Recent Citations & Activity) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status Card (Occupies 2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-navy-900">System Status</h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Backend Port 5000 Online
            </span>
          </div>

          {/* Status Rows */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">REST API Gateway</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                http://127.0.0.1:5000
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">SQLite Database</span>
              <span className="text-blue-600 font-bold flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                parkwise.db ({totalViolations} Citations)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Monitored Corridor Zones</span>
              <span className="text-slate-800 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {activeRulesCount} Active / {totalRulesCount || 5} Total
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Grace Window Auditor (PR-101)</span>
              <span className="text-blue-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                10m Buffer Configured
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Registered Demonstration Vehicles</span>
              <span className="text-slate-800 font-mono font-semibold">
                {overview?.vehicles_monitored || 4} Vehicles (PB • DL • MH • HR)
              </span>
            </div>
          </div>

          {/* Quick Demonstration Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1-Click Demonstration Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedViolationId('IND-VIO-2024-8841');
                  navigateTo('details', { violationId: 'IND-VIO-2024-8841' });
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-left transition-colors cursor-pointer text-xs"
              >
                <p className="font-bold">Test Ticket #8841</p>
                <p className="text-[10px] text-slate-400">Sample grace appeal</p>
              </button>

              <button
                onClick={() => {
                  loginAs('admin');
                  navigateTo('admin');
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-left transition-colors cursor-pointer text-xs"
              >
                <p className="font-bold">Officer Adjudication</p>
                <p className="text-[10px] text-slate-400">Insp. Rakesh Verma</p>
              </button>
            </div>
          </div>
        </div>

        {/* Explainable AI Highlight Card (Occupies 1 col on desktop) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                Explainable AI (XAI Benchmark)
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                PR-101.B
              </span>
            </div>
            <h4 className="font-bold text-sm text-white">
              Sample Guideline Grace Period Demonstration
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              Ticket recorded 6 minutes post meter expiry on Mall Road, Ludhiana. Under Sample Guideline PR-101.B, documented payment latency qualifies for administrative review (waivers are subject to adjudicator discretion and not guaranteed).
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() =>
                navigateTo('ai-assistant', {
                  query: 'Explain why ticket IND-VIO-2024-8841 is eligible for grace window dismissal'
                })
              }
              className="w-full py-2 px-3 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ask AI About This Ground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
