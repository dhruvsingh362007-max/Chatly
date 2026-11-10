import React, { useState } from 'react';
import { Car, ShieldCheck, GraduationCap, Scale, BookOpen, X, Code2, ShieldAlert } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Footer = () => {
  const { navigateTo } = useParking();
  const [activeModal, setActiveModal] = useState(null); // 'privacy', 'terms', 'api'

  return (
    <>
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-bold text-navy-900">ParkWise AI</span>
            <span>•</span>
            <span className="text-[11px] text-slate-500">
              Department of Computer Science & Engineering Capstone Project
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setActiveModal('privacy')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Privacy & Governance
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('terms')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Demonstration Terms
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('api')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              API Architecture
            </button>
          </div>
        </div>
      </footer>

      {/* Information Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeModal === 'privacy' && <ShieldCheck className="w-5 h-5 text-cyan-400" />}
                {activeModal === 'terms' && <Scale className="w-5 h-5 text-amber-400" />}
                {activeModal === 'api' && <Code2 className="w-5 h-5 text-emerald-400" />}
                <h3 className="font-bold text-sm text-white">
                  {activeModal === 'privacy' && 'Academic Privacy & Data Governance'}
                  {activeModal === 'terms' && 'Demonstration Compliance Terms'}
                  {activeModal === 'api' && 'Proposed Municipal API Architecture Specs'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs text-slate-700 space-y-3 leading-relaxed">
              {activeModal === 'privacy' && (
                <>
                  <p className="font-semibold text-navy-900">
                    Sample Data & Privacy Architecture
                  </p>
                  <p>
                    All vehicle registration plates (e.g., PB10AB1234), driver license identifiers, and photographic evidence used within this interface are synthetically generated for demonstration. No Personally Identifiable Information (PII) is stored or transmitted to external servers.
                  </p>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px]">
                    Policy: Local client-side sandboxing only. Zero external telemetry transmission.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p className="font-semibold text-navy-900">
                    Demonstration System Disclaimer
                  </p>
                  <p>
                    This system provides explainable AI recommendations based on configurable demonstration guidelines (e.g., Sample Parking Guideline Rule PR-101.B). Generated appeal briefs are educational prototypes designed to simulate administrative review, not formal legal counsel.
                  </p>
                  <p className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                    Statutory Rule: Drivers maintain individual responsibility for official municipal filings within their respective jurisdiction.
                  </p>
                </>
              )}

              {activeModal === 'api' && (
                <>
                  <p className="font-semibold text-navy-900">
                    REST & Microservice Blueprint (Future Scope)
                  </p>
                  <div className="bg-navy-950 text-slate-300 p-3 rounded-lg font-mono text-[11px] space-y-1">
                    <p className="text-cyan-400">GET /api/v1/violations/:vehiclePlate</p>
                    <p className="text-emerald-400">POST /api/v1/disputes/synthesize-brief</p>
                    <p className="text-blue-400">POST /api/v1/settlement/process-clearance</p>
                    <p className="text-amber-400">GET /api/v1/ordinances/grace-windows</p>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Designed with an OpenAPI specification for future Node.js / Python FastAPI microservice integration.
                  </p>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
