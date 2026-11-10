import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_USER,
  INITIAL_ADMIN,
  INITIAL_VIOLATIONS,
  MUNICIPAL_RULES,
  INITIAL_REPORTED_VIOLATIONS
} from '../data/mockData';
import {
  getViolations,
  getDriverById,
  submitDisputeApi,
  getDisputes,
  updateDisputeStatusApi,
  updateViolationStatusApi,
  getReports,
  submitReportApi
} from '../services/api';

const ParkingContext = createContext();

export const ParkingProvider = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState('landing'); // landing, auth, dashboard, details, report, chat, admin
  const [selectedViolationId, setSelectedViolationId] = useState('IND-VIO-2024-8841');
  const [chatInitialQuery, setChatInitialQuery] = useState('');

  // Authentication State
  const [user, setUser] = useState(INITIAL_USER); // Default to logged in as driver for convenience
  const [role, setRole] = useState('driver'); // 'driver' or 'admin'

  // Violations & Data State (Upgrades to IND dataset cleanly)
  const [violations, setViolations] = useState(() => {
    try {
      const saved = localStorage.getItem('parkwise_ind_violations_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && parsed[0].id.startsWith('IND-')) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }
    return INITIAL_VIOLATIONS;
  });

  const [rules, setRules] = useState(() => {
    try {
      const saved = localStorage.getItem('parkwise_ind_rules_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && parsed[0].id.includes('IND')) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }
    return MUNICIPAL_RULES;
  });

  const [reportedViolations, setReportedViolations] = useState(() => {
    try {
      const saved = localStorage.getItem('parkwise_ind_reports_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && parsed[0].id.includes('IND')) {
          return parsed;
        }
      }
    } catch (e) {
      // Fallback
    }
    return INITIAL_REPORTED_VIOLATIONS;
  });

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const [disputes, setDisputes] = useState([]);

  // Sync with Backend SQLite API
  const refreshViolations = useCallback(async () => {
    try {
      const data = await getViolations();
      if (data && data.violations && data.violations.length > 0) {
        setViolations(data.violations);
      }
    } catch (e) {
      console.warn('Backend SQLite API not reachable, using cached/local violations:', e);
    }
  }, []);

  const refreshDisputes = useCallback(async () => {
    try {
      const data = await getDisputes();
      if (data && data.disputes) {
        setDisputes(data.disputes);
      }
    } catch (e) {
      console.warn('Backend SQLite disputes API not reachable, using cached/local disputes:', e);
    }
  }, []);

  const refreshReports = useCallback(async () => {
    try {
      const data = await getReports();
      if (data && data.reports && data.reports.length > 0) {
        const normalized = data.reports.map((r) => ({
          id: r.id,
          reportedBy: r.reported_by || r.reportedBy,
          vehiclePlate: r.vehicle_plate || r.vehiclePlate,
          location: r.location,
          violationType: r.violation_type || r.violationType,
          photoUrl: r.photo_url || r.photoUrl,
          confidence: r.confidence,
          notes: r.notes,
          status: r.status,
          timestamp: r.timestamp
        }));
        setReportedViolations(normalized);
      }
    } catch (e) {
      console.warn('Backend SQLite reports API not reachable, using cached/local reports:', e);
    }
  }, []);

  useEffect(() => {
    refreshViolations();
    refreshReports();
    refreshDisputes();
  }, [refreshViolations, refreshReports, refreshDisputes]);

  // Sync with LocalStorage for persistence fallback
  useEffect(() => {
    localStorage.setItem('parkwise_ind_violations_v2', JSON.stringify(violations));
  }, [violations]);

  useEffect(() => {
    localStorage.setItem('parkwise_ind_rules_v2', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('parkwise_ind_reports_v2', JSON.stringify(reportedViolations));
  }, [reportedViolations]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const navigateTo = (view, extraParams = {}) => {
    if (extraParams.violationId) {
      setSelectedViolationId(extraParams.violationId);
    }
    if (extraParams.query) {
      setChatInitialQuery(extraParams.query);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch between Driver and Admin
  const loginAs = (userRole) => {
    if (userRole === 'admin') {
      setUser(INITIAL_ADMIN);
      setRole('admin');
      showToast('Signed in as Municipal Enforcement Officer (Inspector Rakesh Verma)', 'info');
      navigateTo('admin');
    } else {
      setUser(INITIAL_USER);
      setRole('driver');
      showToast(`Welcome back, ${INITIAL_USER.name} (${INITIAL_USER.vehicles[0].plate})`, 'info');
      navigateTo('dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    setRole('guest');
    showToast('Signed out successfully', 'info');
    navigateTo('landing');
  };

  // Submit a dispute for a violation (Saves to Flask SQLite Backend)
  const submitDispute = async (violationId, disputeReason, generatedLetter = '') => {
    try {
      await submitDisputeApi({
        violationId,
        reason: disputeReason,
        letterText: generatedLetter,
        evidenceSubmitted: true
      });
      await refreshViolations();
      showToast(`Dispute for citation ${violationId} lodged successfully! Demonstration appeal recorded in SQLite.`, 'success');
      return true;
    } catch (err) {
      console.warn('Dispute submission backend error, falling back locally:', err);
      setViolations((prev) =>
        prev.map((v) => {
          if (v.id === violationId) {
            return {
              ...v,
              status: 'Under Dispute',
              disputeDetails: {
                submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                reason: disputeReason,
                generatedLetter,
                evidenceSubmitted: true,
                status: 'Under Demonstration Review by Parking Cell'
              }
            };
          }
          return v;
        })
      );
      showToast(`Dispute for ${violationId} recorded (Offline notice: ${err.message})`, 'info');
      return false;
    }
  };

  // Pay fine in INR (Simulated demonstration payment saved to Flask SQLite Backend)
  const payFine = async (violationId, paymentDetails = {}) => {
    const target = violations.find((v) => v.id === violationId);
    const total = target ? ((target.fineAmount ?? target.fine_amount ?? 0) + (target.lateFee ?? target.late_fee ?? 0)) : 500;
    const methodStr = `Paid in Full via Demo UPI Payment Gateway (₹${total.toFixed(0)}) [${paymentDetails.paymentMethod || 'UPI Intent'}]`;

    try {
      await updateViolationStatusApi(violationId, {
        status: 'Resolved',
        resolutionMethod: methodStr
      });
      await refreshViolations();
      showToast(`Fine settlement for ${violationId} confirmed! Demonstration clearance saved in SQLite.`, 'success');
      return true;
    } catch (err) {
      console.warn('Payment update backend error, falling back locally:', err);
      setViolations((prev) =>
        prev.map((v) => {
          if (v.id === violationId) {
            return {
              ...v,
              status: 'Resolved',
              resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              resolutionMethod: methodStr
            };
          }
          return v;
        })
      );
      showToast(`Fine settlement for ${violationId} confirmed! Demonstration receipt issued.`, 'success');
      return false;
    }
  };

  // Admin Actions: Approve or Reject Dispute (Persists to Flask SQLite Backend)
  const adjudicateDispute = async (violationId, action, reasonNotes = '') => {
    // 1. Locate corresponding dispute ID if known
    let targetDisputeId = null;
    const matchedDispute = disputes.find(
      (d) => (d.violation_id === violationId || d.violationId === violationId) &&
             !d.status?.toLowerCase().includes('approved') &&
             !d.status?.toLowerCase().includes('dismissed')
    );
    if (matchedDispute) {
      targetDisputeId = matchedDispute.id;
    } else {
      const targetV = violations.find((v) => v.id === violationId);
      if (targetV?.disputeDetails?.id) {
        targetDisputeId = targetV.disputeDetails.id;
      }
    }

    try {
      if (targetDisputeId) {
        await updateDisputeStatusApi(targetDisputeId, {
          status: action === 'approve' ? 'approved' : 'rejected',
          adjudicatorNotes: reasonNotes || `Demonstration review: ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          waiveFine: action === 'approve'
        });
      } else {
        await updateViolationStatusApi(violationId, {
          status: action === 'approve' ? 'Resolved' : 'Pending',
          resolutionMethod: action === 'approve' ? `Dispute Approved - Fine Waived: ${reasonNotes || 'Sample administrative exception granted.'}` : null
        });
      }

      await Promise.all([refreshViolations(), refreshDisputes()]);

      showToast(
        action === 'approve'
          ? `Citation ${violationId} appeal approved & fine waived in SQLite.`
          : `Dispute for ${violationId} rejected in SQLite. Citation returned to active pending status.`,
        action === 'approve' ? 'success' : 'warning'
      );
      return true;
    } catch (err) {
      console.warn('Backend adjudication update failed, falling back locally:', err);
      setViolations((prev) =>
        prev.map((v) => {
          if (v.id === violationId) {
            if (action === 'approve') {
              return {
                ...v,
                status: 'Resolved',
                resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                resolutionMethod: `Dispute Approved - Fine Waived: ${reasonNotes || 'Valid sample exception verified.'}`,
                fineAmount: 0,
                lateFee: 0,
                disputeDetails: {
                  ...v.disputeDetails,
                  status: 'Approved by Adjudicator - Zero Fine'
                }
              };
            } else {
              return {
                ...v,
                status: 'Pending',
                disputeDetails: {
                  ...v.disputeDetails,
                  status: `Dispute Denied: ${reasonNotes || 'Insufficient corroborating demonstration evidence.'}`
                }
              };
            }
          }
          return v;
        })
      );
      showToast(
        action === 'approve'
          ? `Citation ${violationId} appeal approved (local fallback)`
          : `Dispute for ${violationId} rejected (local fallback)`,
        action === 'approve' ? 'success' : 'warning'
      );
      return false;
    }
  };

  // Add Citizen/Driver Report (Saves to Flask SQLite Backend)
  const addReportedViolation = async (reportData) => {
    try {
      const res = await submitReportApi({
        vehiclePlate: reportData.vehiclePlate,
        location: reportData.location,
        violationType: reportData.violationType,
        reportedBy: user ? user.name : 'Verified Citizen',
        photoUrl: reportData.imageUrl || reportData.photoUrl,
        notes: reportData.description || 'Reported via ParkWise AI Citizen Portal.',
        confidence: '95% confidence (Vision Pre-Scan)'
      });

      await refreshReports();
      showToast(`Incident report ${res.report?.id || ''} saved to SQLite database!`, 'success');
      return res.report;
    } catch (err) {
      console.warn('Backend report submission error, saving locally:', err);
      const newReport = {
        id: `REP-IND-${Date.now().toString().slice(-4)}`,
        reportedBy: user ? user.name : 'Verified Citizen',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Pending Review by Parking Cell',
        ...reportData
      };
      setReportedViolations((prev) => [newReport, ...prev]);
      showToast(`Incident recorded (Local fallback: ${err.message})`, 'info');
      return newReport;
    }
  };

  // Toggle Rule Status (Admin)
  const toggleRuleStatus = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
    showToast('Parking guideline enforcement status updated.', 'info');
  };

  // Add Rule (Admin)
  const addRule = (newRule) => {
    setRules((prev) => [...prev, { ...newRule, id: `RUL-IND-${Date.now().toString().slice(-3)}` }]);
    showToast('New sample parking guideline established in registry.', 'success');
  };

  // Update Existing Rule (Admin)
  const updateRule = (updatedRule) => {
    setRules((prev) =>
      prev.map((r) => (r.id === updatedRule.id ? updatedRule : r))
    );
    showToast(`Sample guideline ${updatedRule.code} updated successfully.`, 'success');
  };

  // Selected violation getter
  const selectedViolation =
    violations.find((v) => v.id === selectedViolationId) || violations[0] || INITIAL_VIOLATIONS[0];

  return (
    <ParkingContext.Provider
      value={{
        currentView,
        navigateTo,
        user,
        role,
        loginAs,
        logout,
        violations,
        refreshViolations,
        disputes,
        refreshDisputes,
        selectedViolation,
        selectedViolationId,
        setSelectedViolationId,
        submitDispute,
        payFine,
        adjudicateDispute,
        rules,
        toggleRuleStatus,
        addRule,
        updateRule,
        reportedViolations,
        refreshReports,
        addReportedViolation,
        chatInitialQuery,
        setChatInitialQuery,
        toast,
        showToast
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
