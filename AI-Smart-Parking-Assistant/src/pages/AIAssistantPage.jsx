import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Scale,
  FileText,
  CreditCard,
  Copy,
  Check,
  ArrowRight,
  Info,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Layers,
  Zap
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { SAMPLE_AI_KNOWLEDGE_BASE } from '../data/mockData';
import { getAiStatus, sendAiChatMessage } from '../services/api';

/**
 * Modular RAG Context Retriever
 * Ready for drop-in backend Google GenAI / Gemini 1.5 Flash SDK integration
 */
const ragRetriever = (query, violations, knowledgeBase) => {
  const q = query.toLowerCase().trim();

  // 1. Check for specific Citation reference
  const citationMatch = q.match(/(IND-VIO-2024-\d{4}|VIO-\d{4}|8841|7930|9104|6512|5402)/i);
  if (citationMatch) {
    const raw = citationMatch[0].toUpperCase();
    const matchedVio = violations.find(
      (v) => v.id.toUpperCase().includes(raw) || v.id.endsWith(raw)
    );
    if (matchedVio) {
      return {
        type: 'citation',
        data: matchedVio,
        source: matchedVio.ordinanceCode,
        reference: matchedVio.aiAssessment?.reference || 'Sample Guideline Database'
      };
    }
  }

  // 2. Check for Knowledge Base / Rule match
  for (const item of knowledgeBase) {
    if (item.queryKeywords.some((keyword) => q.includes(keyword))) {
      return {
        type: 'rule',
        data: item,
        source: item.source,
        reference: item.title
      };
    }
  }

  return null;
};

// Polite greeting detection
const isGreetingQuery = (query) => {
  const clean = query.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  const greetingWords = [
    'hi',
    'hello',
    'hey',
    'namaste',
    'good morning',
    'good afternoon',
    'good evening',
    'greetings',
    'hola',
    'help'
  ];
  return greetingWords.some((w) => clean === w || clean.startsWith(w + ' '));
};

export const AIAssistantPage = () => {
  const {
    chatInitialQuery,
    setChatInitialQuery,
    violations,
    navigateTo,
    setSelectedViolationId,
    showToast
  } = useParking();

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello! I am **ParkWise AI**, your explainable parking compliance assistant.

How can I help you today?
* Inquire about sample violations (e.g., *"Why was ticket IND-VIO-2024-8841 issued?"*)
* Explore sample parking guidelines (e.g., *"Explain the 10-minute digital grace window"*)
* Learn about yellow kerb restrictions or EV charging bay rules.`,
      timestamp: 'Just now',
      source: null,
      actions: [
        { label: 'Analyze Ticket #IND-VIO-2024-8841', query: 'Why did I get ticket IND-VIO-2024-8841?' },
        { label: 'Explain 10-Min Grace Period', query: 'What is the 10-minute digital grace period rule?' },
        { label: 'Check Yellow Kerb Restrictions', query: 'What are the rules for parking near yellow curbs?' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [aiStatus, setAiStatus] = useState({
    configured: false,
    mode: 'sqlite_fallback',
    model: 'gemini-2.5-flash'
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load AI configuration status from Flask backend
  useEffect(() => {
    getAiStatus()
      .then((res) => {
        if (res && res.status === 'success') {
          setAiStatus(res);
        }
      })
      .catch((err) => {
        console.warn('Backend AI status endpoint unreachable, using client telemetry:', err);
      });
  }, []);

  useEffect(() => {
    if (chatInitialQuery) {
      handleSend(chatInitialQuery);
      setChatInitialQuery('');
    }
  }, [chatInitialQuery]);

  const synthesizeResponse = (userText) => {
    // 1. Greeting
    if (isGreetingQuery(userText)) {
      return {
        text: `Hello! How can I assist you with your parking compliance inquiry today?

You can ask me to:
* Look up any sample citation (e.g., *IND-VIO-2024-8841* on Mall Road)
* Explain sample curbside rules (e.g., *Rule PR-101* grace period)
* Review potential appeal grounds for demonstration citations.`,
        source: null,
        showDisputeAction: false
      };
    }

    // 2. RAG Retrieval
    const context = ragRetriever(userText, violations, SAMPLE_AI_KNOWLEDGE_BASE);

    if (context && context.type === 'citation') {
      const vio = context.data;
      return {
        text: `### Sample AI Compliance Breakdown: Citation #${vio.id}

**Vehicle:** ${vio.vehiclePlate} (${vio.vehicleDetails})  
**Recorded Violation:** ${vio.type}  
**Location:** ${vio.location}  
**Penalty Assessed:** ₹${(vio.fineAmount + vio.lateFee).toFixed(0)} (${vio.status})

#### Demonstration AI Diagnosis:
${vio.aiAssessment?.summary || 'Standard sample analysis based on curbside duration.'}

#### Defensible Sample Grounds:
${vio.aiAssessment?.legalGrounds?.map((g) => `* **${g}**`).join('\n') || '* Sample grace window benchmark applies.'}

**AI Viability Rating:** **${vio.aiAssessment?.confidenceScore || 85}% Potential for Dismissal (Sample Data)**  
*Next Step:* ${vio.aiAssessment?.recommendedPath || 'Submit an informal demonstration review.'}`,
        violationId: vio.id,
        source: context.source,
        reference: context.reference,
        showDisputeAction: vio.status !== 'Resolved'
      };
    }

    if (context && context.type === 'rule') {
      const kb = context.data;
      return {
        text: kb.response,
        source: context.source,
        reference: context.reference,
        showDisputeAction: false
      };
    }

    // 3. Fallback
    return {
      text: `### Sample Parking Compliance Guidance

Regarding your question on **"${userText}"**:

In our demonstration compliance framework:
1. **Curbside Signage:** Restrictions require clear, unobstructed regulatory signage within normal roadway approach visibility.
2. **Grace Windows:** Sample guideline **Rule PR-101.B** accommodates a 10-minute buffer when digital transaction or payment gateway latency is recorded.
3. **Informal Reviews:** Drivers can submit photographic evidence (e.g. obscured signs or payment receipts) through the demonstration dispute portal.

*Note: This platform operates on configurable sample guidelines for academic demonstration and does not cite real-world statutory legislation or government acts.*`,
      source: 'Sample Urban Parking Guidelines (Demonstration Benchmark)',
      reference: 'General Urban Compliance Benchmark',
      showDisputeAction: false
    };
  };

  const handleSend = async (textToSend = input) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Prepare conversation history for backend context
    const recentHistory = messages
      .slice(-4)
      .map((m) => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

    try {
      // 1. Send inquiry to Flask backend (Gemini Flash + SQLite RAG Context)
      const res = await sendAiChatMessage({
        message: trimmed,
        history: recentHistory
      });

      if (res && res.status === 'success' && res.reply) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.reply,
          violationId: res.violation_id,
          source: res.source,
          reference: res.reference,
          showDisputeAction: Boolean(res.violation_id),
          actions: res.suggested_actions,
          isFallback: res.is_fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }
      throw new Error(res.message || 'Empty AI response received.');
    } catch (err) {
      console.warn('Backend Gemini API inquiry failed, using local database benchmark:', err);
      // 2. Seamless local fallback if backend offline
      const responseData = synthesizeResponse(trimmed);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseData.text,
        violationId: responseData.violationId,
        source: responseData.source,
        reference: responseData.reference,
        showDisputeAction: responseData.showDisputeAction,
        isFallback: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    showToast('AI response copied to clipboard.', 'info');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">AI Assistant</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                aiStatus?.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
              title={
                aiStatus?.configured
                  ? `Active Google Gemini Flash model: ${aiStatus.model}`
                  : 'Operating in SQLite Grounded Database Mode'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  aiStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600 animate-pulse'
                }`}
              />
              {aiStatus?.configured ? 'Gemini Flash Live' : 'RAG Database Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Explainable AI parking compliance guidance, grace period auditing and dispute reasoning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Driver Portal
          </button>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-[700px]">
        {/* Suggested Quick Prompt Chips */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Suggested:
          </span>
          <button
            onClick={() => handleSend('Why did I get ticket IND-VIO-2024-8841?')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer text-xs"
          >
            Why ticket #8841 on Mall Road?
          </button>
          <button
            onClick={() => handleSend('What is the 10-minute digital grace period rule?')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer text-xs"
          >
            Sample 10-min grace rule (PR-101)
          </button>
          <button
            onClick={() => handleSend('What are the rules for parking near yellow curbs?')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer text-xs"
          >
            Yellow kerb obstruction (PR-102)
          </button>
          <button
            onClick={() => handleSend('Can I dispute a hospital gate clearance penalty?')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer text-xs"
          >
            Emergency gate clearance (PR-103)
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {messages.map((msg, idx) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-start justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-1.5 max-w-2xl ${isAi ? '' : 'items-end'}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                      isAi
                        ? 'bg-slate-50/90 border border-slate-200 text-slate-800'
                        : 'bg-blue-600 text-white rounded-tr-xs'
                    }`}
                  >
                    {/* Render message body */}
                    <div className="whitespace-pre-wrap space-y-1.5 font-sans">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="leading-relaxed">
                          {paragraph.split('**').map((chunk, cIdx) =>
                            cIdx % 2 === 1 ? <strong key={cIdx} className="font-bold">{chunk}</strong> : chunk
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Source / Reference Section */}
                    {isAi && msg.source && (
                      <div className="mt-3.5 pt-3 border-t border-slate-200/80 bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-navy-900">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>Source / Reference Benchmark:</span>
                        </div>
                        <p className="text-slate-700 font-mono text-[10px]">
                          {msg.source}
                        </p>
                        <p className="text-[10px] text-slate-400 italic">
                          Scope: Configurable sample guideline for demonstration; not statutory legislation.
                        </p>
                      </div>
                    )}

                    {/* Action chips inside AI message */}
                    {msg.actions && (
                      <div className="pt-3 flex flex-wrap gap-2 border-t border-slate-200 mt-3">
                        {msg.actions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            onClick={() => handleSend(act.query)}
                            className="px-2.5 py-1 rounded-lg bg-white text-blue-700 font-semibold border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer text-xs"
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Linked Violation Action */}
                    {msg.violationId && (
                      <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedViolationId(msg.violationId);
                            navigateTo('details', { violationId: msg.violationId });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Open Citation Dossier</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message timestamp & copy */}
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {isAi && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Response</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-slate-600 ml-1">
                  Synthesizing sample parking rules & telemetry...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about a sample citation (e.g. 'Why ticket IND-VIO-2024-8841?') or type 'Hello'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-xs rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
              title="Send Inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            {aiStatus?.configured
              ? `Live AI Grounding: Connected to Google Gemini Flash API (${aiStatus.model}) with SQLite Database RAG telemetry.`
              : 'Demonstration Mode: ParkWise AI provides explainable guidance based on configurable sample rules & SQLite records.'}
          </p>
        </div>
      </div>
    </div>
  );
};
