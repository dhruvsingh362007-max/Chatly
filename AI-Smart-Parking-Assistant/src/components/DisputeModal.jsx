import React, { useState } from 'react';
import { X, Sparkles, FileText, CheckCircle, Upload, ShieldAlert, ArrowRight } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const DisputeModal = ({ violation, isOpen, onClose }) => {
  const { submitDispute } = useParking();

  if (!isOpen || !violation) return null;

  const total = violation.fineAmount + violation.lateFee;

  const defaultLetter = `DATE: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
TO: Municipal Parking Compliance Cell / Grievance Redressal Wing
SUBJECT: Demonstration Administrative Appeal for Citation #${violation.id}
VEHICLE REGISTRATION: ${violation.vehiclePlate} (${violation.vehicleDetails || 'Registered Vehicle'})

Dear Hearing Officer,

I am formally requesting an administrative review of parking citation #${violation.id} recorded on ${violation.issueDate} at ${violation.location}.

GROUNDS FOR DEMONSTRATION APPEAL:
Under ${violation.ordinanceCode || 'Sample Parking Guidelines'}, this citation meets criteria for an administrative review:
1. ${violation.aiAssessment?.legalGrounds?.[0] || 'Sample 10-minute grace window was active.'}
2. Prior to issuance, the vehicle was operated in accordance with curbside visibility standards.
3. ${violation.aiAssessment?.summary || 'Supporting digital transaction records indicate no willful violation.'}

In accordance with sample parking guidelines, I respectfully request that this citation fine of ₹${total.toFixed(0)} be reviewed and waived.

Sincerely,
${violation.driverName || 'Registered Driver'}
Enclosures: Photo evidence, Digital payment / UPI transaction attempt timestamp`;

  const [reason, setReason] = useState(
    violation.aiAssessment?.legalGrounds?.[0] || 'Sample Guideline PR-101.B: 10-minute digital grace window applicable.'
  );
  const [appealLetter, setAppealLetter] = useState(defaultLetter);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEvidence, setHasEvidence] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitDispute(violation.id, reason, appealLetter);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = () => {
    setAppealLetter(
      appealLetter +
        `\n\n[SAMPLE BENCHMARK ADDITION]: Verified compliance with Sample Parking Guideline Rule PR-101 (Curbside Turnover Buffer).`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-800 rounded-lg text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">AI Dispute Resolution Generator</h3>
              <p className="text-xs text-slate-300">Citation #{violation.id} • {violation.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Merit Badge */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-900">Sample AI Appeal Merit (Demo):</span>
            <span className="px-2 py-0.5 bg-blue-100 text-navy-800 font-semibold rounded-md">
              {violation.aiAssessment?.confidenceScore || 85}% Basis Rating (Discretionary)
            </span>
          </div>
          <span className="text-slate-600 font-medium">
            Potential Savings: <strong className="text-emerald-700">₹{total.toFixed(0)}</strong> (Subject to Review)
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
              Primary Appeal Ground (Sample Benchmark)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
            >
              <option value="Sample Guideline PR-101.B: 10-minute digital grace window applicable">
                Sample Guideline PR-101.B: 10-minute digital grace window applicable
              </option>
              <option value="Sample Guideline PR-102.D: Signage obscured by temporary barricades">
                Sample Guideline PR-102.D: Signage obscured by temporary barricades
              </option>
              <option value="Digital payment kiosk or UPI gateway timeout error">
                Digital payment kiosk or UPI gateway timeout error
              </option>
              <option value="Authorized medical emergency delivery drop-off exception">
                Authorized medical emergency delivery drop-off exception
              </option>
              <option value="Vehicle registration plate OCR misidentification error">
                Vehicle registration plate OCR misidentification error
              </option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                AI Generated Formal Appeal Brief (Demonstration Draft)
              </label>
              <button
                type="button"
                onClick={handleRegenerate}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Add sample reference
              </button>
            </div>
            <textarea
              rows={8}
              value={appealLetter}
              onChange={(e) => setAppealLetter(e.target.value)}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {/* Evidence Upload Mock */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-navy-900">Demonstration Evidence Attached</p>
                <p className="text-[11px] text-slate-500">
                  {hasEvidence ? '1 citation photo + 1 UPI transaction log attached' : 'No files attached'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHasEvidence(!hasEvidence)}
              className="text-xs font-medium text-navy-700 bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {hasEvidence ? 'Change Evidence' : 'Attach Photo'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>Transmitting Appeal Brief...</>
              ) : (
                <>
                  Transmit Appeal to Parking Cell
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
