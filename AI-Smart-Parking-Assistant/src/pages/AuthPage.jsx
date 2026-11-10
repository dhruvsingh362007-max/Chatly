import React, { useState } from 'react';
import {
  Car,
  Building2,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  FileBadge,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const AuthPage = () => {
  const { loginAs, navigateTo } = useParking();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState('driver'); // 'driver' or 'admin'

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  const fillDemoCredentials = (fillRole) => {
    if (fillRole === 'driver') {
      setSelectedRole('driver');
      setEmail('aman.singh@example.in');
      setPassword('demoDriver2024');
      setName('Amanpreet Singh');
      setVehiclePlate('PB10AB1234');
      setDriverLicense('DL-PB102022004581');
    } else {
      setSelectedRole('admin');
      setEmail('admin.verma@urbanmobility.gov.in');
      setPassword('demoOfficer2024');
      setName('Inspector Rakesh Verma');
      setBadgeNumber('IN-TC-402');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginAs(selectedRole);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full space-y-5 animate-in fade-in duration-200">
        {/* Brand header */}
        <div className="text-center space-y-1.5">
          <div
            onClick={() => navigateTo('landing')}
            className="inline-flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-navy-900 tracking-tight">ParkWise AI</span>
          </div>
          <h2 className="text-lg font-bold text-navy-900">
            {isRegister ? 'Register Vehicle Profile' : 'Sign In to Compliance Portal'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Register vehicles to receive automated citation alerts and AI dispute tools.'
              : 'Access your vehicle compliance history, dispute filings, and fine clearances.'}
          </p>
        </div>

        {/* 1-Click Demo Login Box (For examiners/reviewers) */}
        <div className="bg-[#0B192C] text-white rounded-2xl p-4 shadow-md border border-[#132A4A] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              1-Click Project Demonstration
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Instant Demo</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-normal">
            Bypass credential entry for university academic demonstration:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => loginAs('driver')}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Driver (PB10AB1234)</span>
            </button>
            <button
              onClick={() => loginAs('admin')}
              className="py-2.5 px-3 rounded-xl bg-[#132A4A] hover:bg-[#1a3861] text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 border border-[#1d4273] shadow-xs transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Admin (Insp. Verma)</span>
            </button>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
          {/* Tab switch */}
          <div className="grid grid-cols-2 border-b border-slate-200 text-xs font-bold text-center">
            <button
              onClick={() => setIsRegister(false)}
              className={`py-3 transition-colors cursor-pointer ${
                !isRegister
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-slate-500 bg-slate-50 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`py-3 transition-colors cursor-pointer ${
                isRegister
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-slate-500 bg-slate-50 hover:text-slate-700'
              }`}
            >
              Register Account
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select Persona Role
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedRole === 'driver'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Car className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Driver / Citizen</p>
                    <p className="text-[10px] text-slate-500">Pay & dispute citations</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">City Adjudicator</p>
                    <p className="text-[10px] text-slate-500">Review & manage rules</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amanpreet Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder={selectedRole === 'admin' ? 'admin.verma@urbanmobility.gov.in' : 'aman.singh@example.in'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {isRegister && selectedRole === 'driver' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">Vehicle Plate</label>
                    <input
                      type="text"
                      placeholder="PB10AB1234"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full text-xs uppercase font-mono rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1">Driver Licence</label>
                    <input
                      type="text"
                      placeholder="DL-PB102022004581"
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value)}
                      className="w-full text-xs font-mono rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {isRegister && selectedRole === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Officer Badge ID</label>
                  <input
                    type="text"
                    placeholder="IN-TC-402"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Quick Fill:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('driver')}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Driver inputs
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Admin inputs
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isRegister ? 'Register & Continue' : `Enter as ${selectedRole === 'admin' ? 'Adjudicator' : 'Driver'}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
