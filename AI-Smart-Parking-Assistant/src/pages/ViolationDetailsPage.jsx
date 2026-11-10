import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Car,
  FileText,
  ShieldCheck,
  Scale,
  Sparkles,
  CreditCard,
  AlertTriangle,
  Download,
  Share2,
  Bot,
  ExternalLink,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { StatusBadge, AIMeritBadge } from '../components/Badge';
import { DisputeModal } from '../components/DisputeModal';
import { PayFineModal } from '../components/PayFineModal';

export const ViolationDetailsPage = () => {
  const { selectedViolation, navigateTo, showToast } = useParking();

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  if (!selectedViolation) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12">
        <p className="text-slate-600 text-sm">No citation selected for detailed review.</p>
        <button
          onClick={() => navigateTo('dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Driver Portal
        </button>
      </div>
    );
  }

  const v = selectedViolation;
  const totalAmount = v.fineAmount + v.lateFee;

  const handlePrintCitation = () => {
    showToast(`Official Citation Notice #${v.id} formatted for print.`, 'info');
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-navy-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Driver Portal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigateTo('ai-assistant', {
                query: `Can you explain the legal basis for violation #${v.id} (${v.type})?`
              })
            }
            className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Ask AI About This Ticket</span>
          </button>

          <button
            onClick={handlePrintCitation}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Print or Export Notice"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Citation Header Card (Clean SaaS style) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold px-2.5 py-1 bg-slate-100 text-navy-900 rounded-lg border border-slate-200">
              {v.id}
            </span>
            <StatusBadge status={v.status} />
            <span className="text-xs text-slate-400 font-mono">Issued {v.issueDate}</span>
          </div>

          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            {v.type}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{v.location}</span>
          </p>
        </div>

        {/* Fine Due Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-right sm:min-w-[220px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {v.status === 'Resolved' ? 'Settlement Status' : 'Amount Outstanding'}
          </p>
          <p className="text-3xl font-black text-navy-900 mt-0.5">
            {v.status === 'Resolved' ? '₹0' : `₹${totalAmount.toFixed(0)}`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {v.status === 'Resolved' ? (
              <span className="text-emerald-600 font-semibold">Violation Fully Cleared ✓</span>
            ) : (
              <span>Due by {v.dueDate}</span>
            )}
          </p>

          {/* Action buttons */}
          {v.status !== 'Resolved' && (
            <div className="flex items-center justify-end gap-2 mt-3.5">
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dispute</span>
              </button>

              <button
                onClick={() => setShowPayModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Fine</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Explainable AI & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Explainable AI Guidance Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-navy-900">
                    Explainable AI (XAI) Demonstration Diagnosis
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Audited against configurable sample guidelines and simulated transaction logs.
                  </p>
                </div>
              </div>

              {v.aiAssessment && (
                <AIMeritBadge
                  verdict={v.aiAssessment.verdict}
                  confidence={v.aiAssessment.confidenceScore}
                />
              )}
            </div>

            {/* AI Explanation Text */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1.5">
              <p className="text-[11px] font-bold text-navy-900 uppercase tracking-wider">
                Sample AI Benchmark Diagnosis
              </p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {v.aiAssessment?.summary || 'Standard violation analysis pending sensor corroboration.'}
              </p>
            </div>

            {/* Cited Legal Grounds */}
            <div>
              <p className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                Defensible Demonstration Grounds
              </p>
              <div className="space-y-2">
                {v.aiAssessment?.legalGrounds?.map((ground, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{ground}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Resolution Path */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <p className="text-xs font-bold text-emerald-900">Recommended Resolution Path</p>
                <p className="text-xs text-emerald-800">
                  {v.aiAssessment?.recommendedPath || 'Submit informal online appeal.'}
                </p>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-1">
                <p className="text-xs font-bold text-indigo-900">Sample Potential Reduction</p>
                <p className="text-xs text-indigo-800 font-semibold">
                  {v.aiAssessment?.potentialFineReduction ? `${v.aiAssessment.potentialFineReduction} (Subject to review)` : 'Eligible for review (Not guaranteed)'}
                </p>
              </div>
            </div>

            {/* Trigger Dispute CTA */}
            {v.status !== 'Resolved' && (
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>Launch AI Dispute Generator</span>
                </button>
                <button
                  onClick={() =>
                    navigateTo('ai-assistant', {
                      query: `Draft an official dispute letter for ticket #${v.id} citing ${v.ordinanceCode}`
                    })
                  }
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold text-xs border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>Interview AI Copilot</span>
                </button>
              </div>
            )}
          </div>

          {/* Photographic Evidence Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-navy-800" />
                <h3 className="text-sm font-bold text-navy-900">Citation Photographic Record (Simulated Demo)</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Camera: {v.officerId}</span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
              <img
                src={v.evidenceImage}
                alt="Parking Citation Evidence"
                className="w-full h-72 object-cover opacity-90 group-hover:scale-101 transition-transform duration-300"
              />

              {/* Overlaid bounding box HUD */}
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="bg-navy-950/80 text-white font-mono text-[10px] px-2 py-1 rounded border border-white/20">
                    SIMULATED OCR PRE-SCAN: {v.vehiclePlate}
                  </span>
                  <span className="bg-rose-600/90 text-white font-mono text-[10px] px-2 py-1 rounded">
                    SAMPLE BOUNDING BOX
                  </span>
                </div>

                <div className="bg-navy-950/80 text-slate-300 font-mono text-[10px] p-2 rounded border border-white/20 flex justify-between">
                  <span>SIMULATED GPS: {v.gps || '30.9010° N, 75.8573° E'}</span>
                  <span>TIMESTAMP: {v.issueDate}:04 UTC</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              {v.description || 'Sample curated demonstration image illustrating curbside non-compliance.'}
            </p>
          </div>
        </div>

        {/* Right Column: Violation Details, Ordinance, and Settlement Breakdown */}
        <div className="space-y-6">
          {/* Vehicle & Registration Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Vehicle & Owner Data</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">License Plate:</span>
                <span className="font-mono font-bold text-navy-900">{v.vehiclePlate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vehicle Make/Model:</span>
                <span className="font-semibold text-slate-800">{v.vehicleDetails}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Registered Driver:</span>
                <span className="font-medium text-slate-800">{v.driverName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Enforcement Unit:</span>
                <span className="font-mono text-slate-800">{v.officerId}</span>
              </div>
            </div>
          </div>

          {/* Governing Ordinance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Governing Benchmark</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <p className="text-xs font-mono font-bold text-navy-900">{v.ordinanceCode}</p>
              <p className="text-[11px] text-slate-500 leading-normal">
                Classified under {v.category || 'Curbside Management'}. Demonstrative municipal parking guideline.
              </p>
            </div>
          </div>

          {/* Settlement Fee Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Settlement Breakdown</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Guideline Penalty:</span>
                <span className="font-semibold text-slate-800">₹{v.fineAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Late Administrative Fee:</span>
                <span className={`font-semibold ${v.lateFee > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  ₹{v.lateFee.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Demonstration Surcharge:</span>
                <span className="text-emerald-600 font-semibold">₹0 (Waived)</span>
              </div>

              <div className="pt-2 flex justify-between items-baseline">
                <span className="font-bold text-navy-900 text-sm">Total Due:</span>
                <span className="text-xl font-black text-navy-900">
                  {v.status === 'Resolved' ? '₹0' : `₹${totalAmount.toFixed(0)}`}
                </span>
              </div>
            </div>

            {v.status !== 'Resolved' ? (
              <button
                onClick={() => setShowPayModal(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Settle Citation Online</span>
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-emerald-800">Clearance Confirmed</p>
                <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                  {v.resolutionMethod || 'Paid in Full'}
                </p>
              </div>
            )}
          </div>

          {/* Active Dispute Details (if any) */}
          {v.disputeDetails && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                <span>Active Dispute Record</span>
              </p>
              <p className="text-xs text-indigo-800 font-medium">
                Status: {v.disputeDetails.status}
              </p>
              <p className="text-[11px] text-indigo-700 leading-normal">
                Filed: {v.disputeDetails.submittedAt} • Reason: {v.disputeDetails.reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DisputeModal
        violation={v}
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
      />

      <PayFineModal
        violation={v}
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
      />
    </div>
  );
};
