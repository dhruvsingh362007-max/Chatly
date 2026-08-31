import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, Shield, Flag, Ban, MoreVertical, CheckCheck } from 'lucide-react';
import { User, SocialAvailability } from '../../types/user';
import { Message } from '../../types/chat';
import { chatService } from '../../services/chatService';
import { nearbyService } from '../../services/nearbyService';
import { safetyService } from '../../services/safetyService';

interface ChatWindowProps {
  connectionId: string;
  otherUser: User;
  currentUser: User;
  onBack: () => void;
  onOpenReport: (user: User) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  connectionId,
  otherUser,
  currentUser,
  onBack,
  onOpenReport,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showSafeMeetTip, setShowSafeMeetTip] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commonInterests = nearbyService.calculateCommonInterests(currentUser, otherUser);
  const icebreakers = chatService.getIcebreakers(otherUser, commonInterests);

  const loadMessages = () => {
    setMessages(chatService.getMessages(connectionId));
  };

  useEffect(() => {
    chatService.setActiveConnection(connectionId);
    setMessages(chatService.getMessages(connectionId));
    const unsub = chatService.subscribe(() => {
      setMessages(chatService.getMessages(connectionId));
    });
    return () => {
      chatService.setActiveConnection(null);
      unsub();
    };
  }, [connectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');
    await chatService.sendMessage(connectionId, text);
    setMessages(chatService.getMessages(connectionId));
  };

  const handleBlock = () => {
    if (confirm(`Block ${otherUser.displayName}? This conversation will end.`)) {
      safetyService.blockUser(otherUser.uid);
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[720px] max-w-4xl mx-auto bg-[#111114] border sm:border-zinc-800 sm:rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="bg-[#141417] px-4 py-3 border-b border-zinc-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={otherUser.profilePhoto}
              alt={otherUser.displayName}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-zinc-700"
            />
            {otherUser.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-[#141417] rounded-full" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{otherUser.displayName}</span>
              <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded font-mono">
                {otherUser.approximateDistance}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Online • {otherUser.currentStatus}</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-44 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 shadow-2xl z-20 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenReport(otherUser);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
              >
                <Flag className="w-3.5 h-3.5 text-zinc-400" />
                <span>Report User</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleBlock();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 flex items-center gap-2"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Block User</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        
        {/* Safe Meet Public Location Reminder Banner */}
        {showSafeMeetTip && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-2 text-xs text-zinc-300 animate-in fade-in">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Safe Meet:</span> Meeting someone new? Choose a public place (e.g. campus cafeteria, student union, busy coffee shop) and stay comfortable.
              </div>
            </div>
            <button
              onClick={() => setShowSafeMeetTip(false)}
              className="text-zinc-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* AI Icebreaker Suggestions */}
        {messages.length < 3 && (
          <div className="p-3.5 rounded-xl bg-[#141417] border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Need an icebreaker? Suggestions based on shared interests:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {icebreakers.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(starter)}
                  className="text-left text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between group"
                >
                  <span>{starter}</span>
                  <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Send ↵</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message History */}
        {messages.map((msg) => {
          const isMe = msg.senderUid === currentUser.uid;
          return (
            <div
              key={msg.messageId}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm font-normal ${
                  isMe
                    ? 'bg-white text-zinc-950 rounded-br-sm'
                    : 'bg-zinc-900 text-zinc-100 rounded-bl-sm border border-zinc-800'
                }`}
              >
                {msg.message}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 px-1">
                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isMe && <CheckCheck className="w-3 h-3 text-zinc-400" />}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isOtherTyping && (
          <div className="flex items-center gap-2">
            <img
              src={otherUser.profilePhoto}
              alt={otherUser.displayName}
              className="w-6 h-6 rounded-full object-cover"
            />
            <div className="bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-[#141417] p-3 border-t border-zinc-800 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={`Message ${otherUser.displayName}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-30 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
