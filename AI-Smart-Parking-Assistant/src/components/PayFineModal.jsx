import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Lock, CheckCircle2, ArrowRight, Smartphone } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const PayFineModal = ({ violation, isOpen, onClose }) => {
  const { payFine } = useParking();

  if (!isOpen || !violation) return null;

  const total = violation.fineAmount + violation.lateFee;
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
  const [upiId, setUpiId] = useState('aman.singh@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('5241 •••• •••• 1234');
  const [expiry, setExpiry] = useState('08/27');
  const [cvv, setCvv] = useState('319');
  const [name, setName] = useState(violation.driverName || 'Amanpreet Singh');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await payFine(violation.id, {
        paymentMethod: paymentMethod === 'upi' ? `UPI (${upiId})` : `Card (${cardNumber.slice(-4)})`,
        name
      });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-800 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Citation Settlement Gateway</h3>
              <p className="text-xs text-slate-300">Demonstration Municipal Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary in INR */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Citation ID:</span>
            <span className="font-semibold text-navy-900">{violation.id}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Vehicle Number:</span>
            <span className="font-mono font-bold text-navy-900">{violation.vehiclePlate}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Violation Type:</span>
            <span className="text-navy-900 font-medium">{violation.type}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Base Penalty:</span>
            <span className="text-navy-900 font-semibold">₹{violation.fineAmount.toFixed(0)}</span>
          </div>
          {violation.lateFee > 0 && (
            <div className="flex justify-between text-xs text-rose-600">
              <span>Late Administration Fee:</span>
              <span>+₹{violation.lateFee.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-emerald-700">
            <span>Demonstration Processing Fee:</span>
            <span className="font-medium">₹0 (Waived)</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-bold text-navy-900">Total Settlement Due:</span>
            <span className="text-2xl font-black text-navy-900">₹{total.toFixed(0)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                paymentMethod === 'upi'
                  ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>UPI (Simulated Demo)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Card (Simulated Demo)</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">Payer Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {paymentMethod === 'upi' ? (
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Virtual Payment Address (UPI ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="username@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports GPay, PhonePe, Paytm, BHIM and netbanking handles.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">Expiry</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1">CVV</label>
                  <input
                    type="text"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Simulated transaction gateway: No real money is debited. Demonstration educational prototype.</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>Processing Clearance...</>
              ) : (
                <>
                  Submit Settlement (₹{total.toFixed(0)})
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
