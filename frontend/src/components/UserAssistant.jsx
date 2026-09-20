import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, Sparkles, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export default function UserAssistant({
  messages,
  onSendMessage,
  isProcessing,
  currentField,
  activeProfile,
  ragGrounding,
  safetyDecision
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
        setIsListening(false);
      }
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const quickPrompts = [
    'My full name is Priya Sharma',
    'Email is priya@example.com',
    'Annual family income is two lakh rupees',
    'My education category is either A or B, just choose one',
    'Submit the form now'
  ];

  return (
    <section
      aria-label="AccessBridge Conversational Assistant"
      className="bg-surface border border-border-custom rounded-xl p-4 flex flex-col h-full shadow-sm"
    >
      {/* Active Field Focus Banner */}
      {currentField && (
        <div
          role="region"
          aria-label="Active Form Field Guidance"
          className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Current Field Focus: {currentField.label || currentField.field_id}
            </span>
            {currentField.required && (
              <span className="text-[10px] font-semibold bg-danger/10 text-danger px-2 py-0.5 rounded border border-danger/30">
                Required Field
              </span>
            )}
          </div>
          <p className="text-xs text-text-primary">
            {currentField.help_text || 'Please speak or enter your information for this field.'}
          </p>
        </div>
      )}

      {/* Safety Alert Banner if Escalated or Low Confidence */}
      {safetyDecision && safetyDecision.decision !== 'EXECUTE' && (
        <div
          role="alert"
          className={`p-3 rounded-lg border mb-3 flex items-start gap-2.5 text-xs ${
            safetyDecision.decision === 'BLOCKED'
              ? 'bg-danger/10 border-danger/40 text-danger'
              : 'bg-warning/10 border-warning/40 text-warning'
          }`}
        >
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <span className="font-bold block uppercase tracking-wider text-[11px]">
              Safety Status: {safetyDecision.decision}
            </span>
            <p className="mt-0.5 leading-relaxed text-text-primary">
              {safetyDecision.reason}
            </p>
          </div>
        </div>
      )}

      {/* RAG Knowledge Grounding Pill */}
      {ragGrounding && ragGrounding.length > 0 && (
        <div className="mb-2 text-[11px] text-text-muted flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="font-semibold text-accent flex items-center gap-1 flex-shrink-0">
            <HelpCircle className="w-3 h-3" /> Grounded In:
          </span>
          {ragGrounding.map((item, idx) => (
            <span
              key={idx}
              className="bg-surface-secondary border border-border-custom px-2 py-0.5 rounded text-[10px] whitespace-nowrap"
              title={item.text}
            >
              {item.source} ({item.section})
            </span>
          ))}
        </div>
      )}

      {/* Message History */}
      <div
        className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[260px] max-h-[380px]"
        role="log"
        aria-live="polite"
        aria-label="Conversation with AccessBridge Assistant"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <Sparkles className="w-8 h-8 text-accent mb-2 opacity-80" aria-hidden="true" />
            <p className="font-bold text-sm text-text-primary">Welcome to AccessBridge</p>
            <p className="text-xs max-w-sm mt-1">
              Speak or type naturally. AccessBridge understands the form, explains difficult fields, verifies every action, and never submits without your approval.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-accent text-accent-fg rounded-br-none'
                    : 'bg-surface-secondary text-text-primary border border-border-custom rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 opacity-80 text-[10px]">
                  <span className="font-semibold">
                    {msg.role === 'user' ? 'You' : 'AccessBridge Assistant'}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.content)}
                      aria-label="Read message aloud"
                      className="hover:opacity-100 opacity-70 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="mt-3 pt-3 border-t border-border-custom">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
          Suggested Inputs for Demo:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(prompt)}
              className="text-[11px] bg-surface-secondary hover:bg-border-custom/50 text-text-primary border border-border-custom px-2.5 py-1 rounded-md transition-colors text-left focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder={isListening ? 'Listening to your voice...' : 'Type natural response or click mic...'}
            aria-label="Your response to the form assistant"
            className="w-full bg-surface-secondary border border-border-custom rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-60"
          />
        </div>

        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop voice listening' : 'Start voice listening'}
            aria-pressed={isListening}
            className={`p-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
              isListening
                ? 'bg-danger text-white border-danger animate-pulse'
                : 'bg-surface-secondary text-text-primary border-border-custom hover:bg-surface'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          aria-label="Send message"
          className="bg-accent text-accent-fg font-semibold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {isProcessing ? (
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send</span>
        </button>
      </form>
    </section>
  );
}
