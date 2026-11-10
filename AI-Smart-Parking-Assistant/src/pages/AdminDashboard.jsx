import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  FileCheck2,
  Scale,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  MapPin,
  Car,
  Edit2
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/Badge';
import { getAdminOverview, getViolations, getDisputes, updateDisputeStatusApi } from '../services/api';

export const AdminDashboard = () => {
  const {
    user,
    violations,
    refreshViolations,
    disputes,
    refreshDisputes,
    adjudicateDispute,
    rules,
    toggleRuleStatus,
    addRule,
    updateRule,
    reportedViolations,
    navigateTo,
    setSelectedViolationId,
    showToast
  } = useParking();

  const [activeTab, setActiveTab] = useState('disputes'); // 'disputes', 'rules', 'reports'
  const [disputeFilter, setDisputeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Backend SQLite API states
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminDisputes, setAdminDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdjudicating, setIsAdjudicating] = useState(false);

  // Load Overview & Disputes directly from Flask REST API
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, disputesData] = await Promise.all([
        getAdminOverview().catch((err) => {
          console.warn('Overview fetch error:', err);
          return null;
        }),
        getDisputes().catch((err) => {
          console.warn('Disputes fetch error:', err);
          return null;
        })
      ]);

      if (overviewData && overviewData.overview) {
        setAdminOverview(overviewData.overview);
      }
      if (disputesData && disputesData.disputes) {
        setAdminDisputes(disputesData.disputes);
      }
      if (refreshViolations) await refreshViolations();
    } catch (err) {
      console.error('Failed to load admin overview or disputes:', err);
      setError(err.message || 'Error connecting to SQLite backend.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshViolations]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Adjudication Modal State
  const [adjudicatingItem, setAdjudicatingItem] = useState(null);
  const [adjudicationNotes, setAdjudicationNotes] = useState('Verified sample grace window and UPI payment latency log.');

  // Add / Edit Rule Modal State
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleFormData, setRuleFormData] = useState({
    code: 'PR-106',
    title: 'Peak Commercial Congestion Zone Restriction',
    zone: 'Market Corridor (Zone M-1)',
    hours: 'Mon-Sat: 08:30 AM - 11:30 AM',
    rate: '₹40/hr',
    fineAmount: 750,
    gracePeriodMinutes: 10,
    active: true,
    description: 'Enforces strict curbside clearance during peak market delivery hours.'
  });

  // Calculate Metrics from backend overview or fallback to context arrays
  const totalCitations = adminOverview?.violations?.total ?? violations.length;
  const activeDisputes = adminOverview?.disputes?.pending_review ?? violations.filter((v) => v.status === 'Under Dispute').length;
  const totalFines = adminOverview?.financials?.total_fines_levied_inr ?? violations.reduce((acc, v) => acc + (v.fineAmount || 0), 0);
  const activeRulesCount = adminOverview?.rules?.active ?? rules.filter((r) => r.active).length;
  const totalRulesCount = adminOverview?.rules?.total ?? rules.length;

  // Filtered Violations for Admin
  const filteredViolations = violations.filter((v) => {
    if (disputeFilter === 'DISPUTES_ONLY') {
      if (v.status !== 'Under Dispute') return false;
    } else if (disputeFilter !== 'ALL') {
      if (v.status !== disputeFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = v.id.toLowerCase().includes(q);
      const matchPlate = v.vehiclePlate.toLowerCase().includes(q);
      const matchType = v.type.toLowerCase().includes(q);
      const matchLoc = v.location.toLowerCase().includes(q);
      if (!matchId && !matchPlate && !matchType && !matchLoc) return false;
    }
    return true;
  });

  const handleConfirmAdjudication = async (action) => {
    if (!adjudicatingItem || isAdjudicating) return;
    setIsAdjudicating(true);

    try {
      // Find matching dispute ID
      const matchedDisp = (adminDisputes && adminDisputes.length > 0 ? adminDisputes : disputes).find(
        (d) => (d.violation_id === adjudicatingItem.id || d.violationId === adjudicatingItem.id) &&
               !d.status?.toLowerCase().includes('approved') &&
               !d.status?.toLowerCase().includes('dismissed')
      );
      const disputeId = matchedDisp?.id || adjudicatingItem.disputeDetails?.id;

      if (disputeId) {
        await updateDisputeStatusApi(disputeId, {
          status: action === 'approve' ? 'approved' : 'rejected',
          adjudicatorNotes: adjudicationNotes || `Demonstration review: ${action === 'approve' ? 'Approved & Fine Dismissed' : 'Rejected'}`,
          waiveFine: action === 'approve'
        });
      } else {
        await adjudicateDispute(adjudicatingItem.id, action, adjudicationNotes);
      }

      showToast(
        action === 'approve'
          ? `Citation #${adjudicatingItem.id} appeal approved! Fine waived (₹0) and saved to SQLite.`
          : `Dispute for #${adjudicatingItem.id} rejected. Saved to SQLite database.`,
        action === 'approve' ? 'success' : 'warning'
      );

      // Refresh all live SQLite data
      await Promise.all([
        refreshViolations?.(),
        refreshDisputes?.(),
        loadDashboardData()
      ]);
      setAdjudicatingItem(null);
    } catch (err) {
      console.warn('Backend dispute status update failed, invoking context fallback:', err);
      await adjudicateDispute(adjudicatingItem.id, action, adjudicationNotes);
      setAdjudicatingItem(null);
    } finally {
      setIsAdjudicating(false);
    }
  };

  const handleOpenAddRule = () => {
    setEditingRule(null);
    setRuleFormData({
      code: `PR-${100 + rules.length + 1}`,
      title: 'Commercial Congestion Area Restriction',
      zone: 'Commercial Zone (City Center)',
      hours: 'Mon-Sat: 09:00 AM - 08:00 PM',
      rate: '₹35/hr',
      fineAmount: 600,
      gracePeriodMinutes: 10,
      active: true,
      description: 'Configurable demonstration guideline for commercial curbside traffic turnover.'
    });
    setShowAddRuleModal(true);
  };

  const handleOpenEditRule = (rule) => {
    setEditingRule(rule);
    setRuleFormData({ ...rule });
    setShowAddRuleModal(true);
  };

  const handleRuleFormSubmit = (e) => {
    e.preventDefault();
    if (editingRule) {
      updateRule(ruleFormData);
    } else {
      addRule(ruleFormData);
    }
    setShowAddRuleModal(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">Municipal Admin Console</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live SQLite Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjudicating Officer: <span className="font-bold text-slate-800">Inspector Rakesh Verma (IN-TC-402)</span> • Zone:{' '}
            <span className="font-semibold text-blue-600">Metro Urban Zone 1</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Driver Portal
          </button>
          <button
            onClick={handleOpenAddRule}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Rule</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Connection warning: {error}. Operating with cached records.</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 rounded text-rose-900 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Aggregate Stats Cards (Matching Image 2 clean style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Citations"
          value={totalCitations}
          subtitle="Registered in system"
          icon={FileCheck2}
          color="navy"
        />

        <StatCard
          title="Appeals Under Review"
          value={activeDisputes}
          subtitle="Requires officer sign-off"
          icon={Scale}
          color="indigo"
        />

        <StatCard
          title="Assessment Volume"
          value={`₹${totalFines.toFixed(0)}`}
          subtitle="Gross compliance fines"
          icon={Building2}
          color="emerald"
        />

        <StatCard
          title="Active Guidelines"
          value={`${activeRulesCount}/${totalRulesCount}`}
          subtitle="Configured benchmarks"
          icon={ShieldCheck}
          color="blue"
        />
      </div>

      {/* Main Tab Navigation Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex items-center border-b border-slate-100 px-6 pt-3 text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab('disputes')}
            className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'disputes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Appeals & Adjudication</span>
            {activeDisputes > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                {activeDisputes}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sample Guidelines ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Field Reports ({reportedViolations.length})</span>
          </button>
        </div>

        {/* TAB 1: VIOLATIONS & DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="p-5 space-y-4">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setDisputeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    disputeFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Records ({violations.length})
                </button>
                <button
                  onClick={() => setDisputeFilter('DISPUTES_ONLY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    disputeFilter === 'DISPUTES_ONLY'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Pending Appeals ({activeDisputes})
                </button>
                <button
                  onClick={() => setDisputeFilter('Pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    disputeFilter === 'Pending'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending Payment
                </button>
                <button
                  onClick={() => setDisputeFilter('Resolved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    disputeFilter === 'Resolved'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Resolved / Waived
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search ID, plate (e.g. PB10)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Citations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Citation ID</th>
                    <th className="px-4 py-3">Vehicle Plate</th>
                    <th className="px-4 py-3">Violation Type</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Penalty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Adjudication Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading && filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold text-slate-600">Loading citations & disputes from SQLite...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-navy-900">{v.id}</td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">{v.vehiclePlate}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">{v.type}</td>
                        <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">{v.location}</td>
                        <td className="px-4 py-3.5 font-bold text-navy-900">₹{v.fineAmount.toFixed(0)}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {v.status === 'Under Dispute' && (
                              <button
                                onClick={() => {
                                  setAdjudicatingItem(v);
                                  setAdjudicationNotes(
                                    v.aiAssessment?.legalGrounds?.[0]
                                      ? `Verified based on: ${v.aiAssessment.legalGrounds[0]}`
                                      : 'Sample administrative review completed.'
                                  );
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Review Appeal</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedViolationId(v.id);
                                navigateTo('details', { violationId: v.id });
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              View File
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RULES & ORDINANCES */}
        {activeTab === 'rules' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-navy-900">Configurable Sample Parking Guidelines</h3>
                <p className="text-xs text-slate-500">
                  Control active enforcement windows, grace periods, and fine amounts across demonstration zones.
                </p>
              </div>

              <button
                onClick={handleOpenAddRule}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Configure Guideline</span>
              </button>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                    rule.active
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {rule.code}
                        </span>
                        <h4 className="font-bold text-sm text-navy-900">{rule.title}</h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            rule.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {rule.active ? 'Active Enforced' : 'Suspended'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rule.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                        <span>
                          <strong>Zone:</strong> {rule.zone}
                        </span>
                        <span>
                          <strong>Hours:</strong> {rule.hours}
                        </span>
                        <span>
                          <strong>Base Penalty:</strong> ₹{rule.fineAmount}
                        </span>
                        <span>
                          <strong>Grace Window:</strong> {rule.gracePeriodMinutes} mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditRule(rule)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          rule.active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {rule.active ? 'Suspend Rule' : 'Activate Rule'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CITIZEN REPORTS */}
        {activeTab === 'reports' && (
          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Field & Citizen Incident Reports</h3>
              <p className="text-xs text-slate-500">
                Crowdsourced incident reports with simulated OCR verification for Indian registration formats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportedViolations.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-navy-900">{rep.id}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-2 py-0.5 rounded-md">
                      {rep.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-navy-900">{rep.violationType}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.location}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 border border-slate-100">
                    <p className="text-slate-600">
                      <strong>Vehicle Plate:</strong>{' '}
                      <span className="font-mono font-bold text-navy-900">{rep.vehiclePlate}</span>
                    </p>
                    <p className="text-slate-600">
                      <strong>Reported By:</strong> {rep.reportedBy} ({rep.timestamp})
                    </p>
                    <p className="text-slate-600">
                      <strong>Notes:</strong> {rep.notes || rep.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Vision Pre-Scan: {rep.confidence || '94% Plate OCR Match'}
                    </span>
                    <button
                      onClick={() => showToast(`Report ${rep.id} assigned to urban traffic unit.`, 'success')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Dispatch Officer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Adjudication Review Modal */}
      {adjudicatingItem && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Adjudicate Citation #{adjudicatingItem.id}</h3>
              </div>
              <button
                onClick={() => setAdjudicatingItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Violation:</span>
                  <span className="font-bold text-navy-900">{adjudicatingItem.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Number:</span>
                  <span className="font-mono font-bold text-navy-900">{adjudicatingItem.vehiclePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penalty Amount:</span>
                  <span className="font-bold text-navy-900">₹{adjudicatingItem.fineAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver Appeal Statement:</span>
                  <span className="italic text-slate-700">
                    "{
                      adminDisputes.find(
                        (d) => d.violation_id === adjudicatingItem.id || d.violationId === adjudicatingItem.id
                      )?.reason ||
                      adjudicatingItem.disputeDetails?.reason ||
                      'Grace window invoked'
                    }"
                  </span>
                </div>
              </div>

              {/* AI Explainability Recommendation */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI Adjudication Diagnostic (Sample Simulation)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    {adjudicatingItem.aiAssessment?.confidenceScore || 85}% Sample Merit Rating
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {adjudicatingItem.aiAssessment?.summary ||
                    'Simulated digital retry records indicate potential sample grace window applicability.'}
                </p>
                {adjudicatingItem.aiAssessment?.reference && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ref: {adjudicatingItem.aiAssessment.reference}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Official Adjudication Finding & Notes
                </label>
                <textarea
                  rows={3}
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isAdjudicating}
                  onClick={() => handleConfirmAdjudication('reject')}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAdjudicating ? 'Updating SQLite...' : `Deny Appeal (Maintain ₹${adjudicatingItem.fineAmount.toFixed(0)})`}
                </button>

                <button
                  type="button"
                  disabled={isAdjudicating}
                  onClick={() => handleConfirmAdjudication('approve')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isAdjudicating ? 'Persisting in SQLite...' : 'Approve & Dismiss Fine (₹0)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">
                  {editingRule ? `Edit Rule ${editingRule.code}` : 'Configure Sample Parking Guideline'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRuleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Guideline Code</label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.code}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value })}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Base Penalty (₹)</label>
                  <input
                    type="number"
                    required
                    value={ruleFormData.fineAmount}
                    onChange={(e) =>
                      setRuleFormData({ ...ruleFormData, fineAmount: Number(e.target.value) })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Guideline Title</label>
                <input
                  type="text"
                  required
                  value={ruleFormData.title}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, title: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Target Zone / Roadway</label>
                <input
                  type="text"
                  required
                  value={ruleFormData.zone}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, zone: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Active Hours</label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.hours}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, hours: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Grace Period (Mins)</label>
                  <input
                    type="number"
                    required
                    value={ruleFormData.gracePeriodMinutes}
                    onChange={(e) =>
                      setRuleFormData({
                        ...ruleFormData,
                        gracePeriodMinutes: Number(e.target.value)
                      })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  value={ruleFormData.description}
                  onChange={(e) =>
                    setRuleFormData({ ...ruleFormData, description: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingRule ? 'Save Changes' : 'Establish Guideline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
