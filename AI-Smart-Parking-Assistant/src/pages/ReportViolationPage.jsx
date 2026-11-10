import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Camera,
  MapPin,
  Car,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Upload,
  Crosshair,
  ShieldAlert,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { getReports } from '../services/api';

export const ReportViolationPage = () => {
  const { addReportedViolation, reportedViolations, refreshReports, navigateTo, showToast } = useParking();

  // Form State
  const [vehiclePlate, setVehiclePlate] = useState('PB10CZ9821');
  const [vehicleDetails, setVehicleDetails] = useState('2023 Maruti Suzuki Swift (White)');
  const [location, setLocation] = useState('Mall Road, Near Fountain Chowk, Ludhiana');
  const [gps, setGps] = useState('30.9010° N, 75.8573° E');
  const [violationType, setViolationType] = useState('Expired Paid Parking Duration');
  const [description, setDescription] = useState(
    'Private vehicle parked past the paid token duration on Mall Road during peak market shopping hours.'
  );
  const [fineAmount, setFineAmount] = useState(500);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Initial fetch of existing reports from SQLite backend
  useEffect(() => {
    if (refreshReports) {
      setLoadingReports(true);
      refreshReports().finally(() => setLoadingReports(false));
    }
  }, [refreshReports]);

  // Sample curated evidence photos
  const sampleEvidence = [
    {
      url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      label: 'Expired Commercial Zone'
    },
    {
      url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      label: 'Emergency Gate Clearance'
    },
    {
      url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      label: 'Yellow Kerb No-Parking'
    }
  ];

  // Violation type presets (Sample Indian Parking Guidelines)
  const violationCategories = [
    { label: 'Expired Paid Parking Duration', fine: 500, code: 'Sample Rule PR-101' },
    { label: 'Designated No-Parking Zone (Yellow Line Marking)', fine: 1000, code: 'Sample Rule PR-102' },
    { label: 'Emergency Gate & Fire Hydrant Clearance Obstruction', fine: 1500, code: 'Sample Rule PR-103' },
    { label: 'Public EV Charging Bay Idle Overstay', fine: 750, code: 'Sample Rule PR-104' },
    { label: 'Commercial Corridor Double Parking', fine: 1000, code: 'Sample Rule PR-105' },
    { label: 'Blocking Private Driveway / Footpath', fine: 500, code: 'Sample Rule PR-106' },
  ];

  const handleTypeChange = (typeName) => {
    setViolationType(typeName);
    const cat = violationCategories.find((c) => c.label === typeName);
    if (cat) {
      setFineAmount(cat.fine);
    }
  };

  const handleUseLocation = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setLocation('Connaught Place, Radial Road 3 (Inner Circle), New Delhi');
      setGps('28.6315° N, 77.2167° E');
      setIsAnalyzing(false);
      showToast('GPS coordinates calibrated for New Delhi CP sector.', 'info');
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsAnalyzing(true);

    try {
      const selectedCategory = violationCategories.find((c) => c.label === violationType);
      const res = await addReportedViolation({
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        vehicleDetails,
        location,
        gps,
        violationType,
        description,
        fineAmount,
        ordinanceCode: selectedCategory?.code || 'Sample Parking Guideline Rule PR-101',
        imageUrl: sampleEvidence[selectedImageIndex].url
      });

      setLastSubmittedId(res?.id || `REP-IND-${Date.now().toString().slice(-3)}`);
      setSubmittedSuccess(true);
    } catch (err) {
      console.error('Report submission failed:', err);
      setFormError(err.message || 'Failed to submit incident report. Please verify backend connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">Report Violation</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live SQLite Incident Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit observed parking non-compliance for optical OCR pre-scan and mock GPS verification saved to SQLite.
          </p>
        </div>

        <button
          onClick={() => navigateTo('dashboard')}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          View Driver Portal
        </button>
      </div>

      {/* Error Message Banner */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-900">Incident Submission Notice</p>
            <p className="text-rose-700 mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {submittedSuccess ? (
        /* Success Screen */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4 shadow-2xs max-w-xl mx-auto animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-navy-900">
            Violation Successfully Logged & Saved to SQLite!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Incident report <span className="font-mono font-bold text-navy-900">{lastSubmittedId || 'REP-IND-NEW'}</span> recorded for vehicle{' '}
            <span className="font-mono font-bold text-navy-900">{vehiclePlate.toUpperCase()}</span>.
            The record is registered in the municipal database and available for enforcement review.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setVehiclePlate('');
                setDescription('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Report Another Issue
            </button>

            <button
              onClick={() => navigateTo('dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Driver Portal
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Municipal Admin
            </button>
          </div>
        </div>
      ) : (
        /* Report Form & HUD Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vehicle Plate & Make */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PB10AB1234"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    Vehicle Model / Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2023 Maruti Suzuki Swift (White)"
                    value={vehicleDetails}
                    onChange={(e) => setVehicleDetails(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Violation Category */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                  Violation Category & Guideline *
                </label>
                <select
                  value={violationType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  {violationCategories.map((cat, idx) => (
                    <option key={idx} value={cat.label}>
                      {cat.label} — ₹{cat.fine} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Location with Geolocation Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Location & Landmark *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Auto-Detect Location
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mall Road, Near Fountain Chowk, Ludhiana"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-400 font-mono mt-1">Simulated GPS: {gps}</p>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5">
                  Photographic Evidence Preview (Sample Curated)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {sampleEvidence.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/20'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-16 object-cover" />
                      <span className="block text-[9px] font-bold p-1 bg-white text-navy-900 truncate">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                  Incident Notes & Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide additional details regarding time observed, driver availability, or blocked emergency corridor..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting & Registering in SQLite...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Submit Incident to SQLite Registry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* AI Real-time Vision Pre-Scan HUD & Recent Reports Log */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Simulated Vision Pre-Scan HUD
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Mock Pre-Scan Active
                </span>
              </div>

              {/* Evidence Image Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src={sampleEvidence[selectedImageIndex].url}
                  alt="Active Evidence"
                  className="w-full h-40 object-cover opacity-90"
                />
                <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
                  <span className="self-start text-[9px] font-mono bg-navy-950/80 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800">
                    SIMULATED OCR: {vehiclePlate || 'AWAITING INPUT'}
                  </span>
                  <span className="self-end text-[9px] font-mono bg-rose-950/80 px-2 py-0.5 rounded text-rose-300 border border-rose-800">
                    SAMPLE BOUNDING BOX
                  </span>
                </div>
              </div>

              {/* Live Diagnostic Findings */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Plate OCR Match:</span>
                  <span className="font-mono text-blue-600 font-bold">Simulated Pattern Match (Demo)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sample Fine Tier:</span>
                  <span className="font-bold text-navy-900">₹{fineAmount}.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Corridor:</span>
                  <span className="text-slate-800 font-medium">Urban Grid Zone C-2</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                "Demonstrative optical bounding box simulates vehicle alignment relative to sample kerb marking standards."
              </div>
            </div>

            {/* Recent Community Reports Log from SQLite (Loading & Empty States) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Recent Community Reports
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">SQLite Live Log</span>
              </div>

              {loadingReports ? (
                <div className="space-y-2 py-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : reportedViolations.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No community reports registered yet.</p>
              ) : (
                <div className="space-y-2.5 divide-y divide-slate-100">
                  {reportedViolations.slice(0, 3).map((rep) => (
                    <div key={rep.id} className="pt-2 first:pt-0 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-navy-900">{rep.id}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 rounded font-semibold text-slate-700">
                          {rep.vehiclePlate}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium truncate mt-0.5">{rep.violationType}</p>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{rep.location}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informational tip */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
              <p className="font-bold">Demonstration Registry</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Submissions automatically update reactive application state and are saved in SQLite, appearing in the municipal enforcement queue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
