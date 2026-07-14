import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Mic, MicOff, Volume2, VolumeX, Send, Languages, Sparkles, Terminal } from 'lucide-react';

interface AIAssistantDrawerProps {
  onToolExecuted: () => void;
}

interface ChatHistoryItem {
  sender: 'user' | 'ai';
  text: string;
  agent?: string;
  metrics?: {
    latencyMs: number;
    tokens: number;
    costUSD: number;
  };
  tools?: Array<{ name: string; params: any }>;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ onToolExecuted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ChatHistoryItem[]>([
    { sender: 'ai', text: 'Welcome to the Smart Stadium Copilot. Ask me about crowd density, volunteer shifts, utility loads, or emergency operations.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [targetLang, setTargetLang] = useState('English');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Voice synthesis: speak response text
  const speak = (text: string) => {
    if (!isSpeaking) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[{}[\]"]/g, '').substring(0, 200); // Truncate and clean JSON
      const utterance = new SpeechSynthesisUtterance(cleanText);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not supported or blocked.', e);
    }
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }

      const recObj = new SpeechRecognition();
      recObj.continuous = false;
      recObj.interimResults = false;
      recObj.lang = 'en-US';

      recObj.onstart = () => {
        setIsListening(true);
      };

      recObj.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };

      recObj.onerror = () => {
        setIsListening(false);
      };

      recObj.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recObj;
      recObj.start();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');
    setLoading(true);

    setHistory(prev => [...prev, { sender: 'user', text: userText }]);

    try {
      let finalPrompt = userText;
      if (targetLang !== 'English') {
        finalPrompt = `${userText} (Please translate your response into ${targetLang})`;
      }

      const res = await api.post<any>('/api/ai/query', { query: finalPrompt });
      
      const newAiItem: ChatHistoryItem = {
        sender: 'ai',
        text: res.responseText,
        agent: res.agentName,
        metrics: res.metrics,
        tools: res.suggestedTools
      };

      setHistory(prev => [...prev, newAiItem]);
      speak(res.responseText);
    } catch (err) {
      setHistory(prev => [...prev, {
        sender: 'ai',
        text: `Error processing request: ${err instanceof Error ? err.message : String(err)}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const executeToolCall = async (tool: { name: string; params: any }) => {
    try {
      if (tool.name === 'updateGateStatus') {
        await api.patch(`/api/stadium/gates/${tool.params.gateId}`, { status: tool.params.status });
        alert(`AI Tool Triggered: Gate status updated to ${tool.params.status}.`);
      } else if (tool.name === 'reallocateVolunteer') {
        await api.patch(`/api/volunteers/${tool.params.volunteerId}/reallocate`, {
          section: tool.params.section,
          task: tool.params.task
        });
        alert(`AI Tool Triggered: Assigned volunteer roster check successfully.`);
      } else if (tool.name === 'fileIncident') {
        await api.post('/api/incidents', {
          title: tool.params.title,
          description: tool.params.description,
          severity: tool.params.severity,
          location: tool.params.location
        });
        alert(`AI Tool Triggered: Reported safety incident at ${tool.params.location}.`);
      }
      onToolExecuted();
    } catch (err) {
      alert(`Tool execution failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <>
      {/* Floating Copilot Button */}
      <button
        id="copilot-floating-btn"
        className="btn btn-primary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          padding: 0,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        aria-label="Open AI Copilot System"
      >
        <Sparkles size={24} />
      </button>

      {/* Slide-out Panel Drawer */}
      <div
        id="copilot-drawer"
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-420px',
          width: '400px',
          height: '100vh',
          zIndex: 1000,
          borderRadius: 0,
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'right var(--transition-normal)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-lg)',
          padding: 0
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Smart Stadium Copilot</h3>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setIsOpen(false)}
            style={{ padding: '4px 8px', fontSize: '0.9rem' }}
          >
            Close
          </button>
        </div>

        {/* Chat History Panel */}
        <div
          id="copilot-history"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {history.map((item, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: item.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: item.sender === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                padding: '12px',
                borderRadius: '8px',
                maxWidth: '85%',
                fontSize: '0.92rem',
                border: item.sender === 'user' ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {/* Agent Badge */}
              {item.agent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', fontSize: '0.75rem', opacity: 0.8, fontWeight: 'bold' }}>
                  <Terminal size={12} />
                  <span>{item.agent} Agent</span>
                </div>
              )}

              {/* Message text */}
              <div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>

              {/* Metrics logs */}
              {item.metrics && (
                <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(120,120,120,0.3)', paddingTop: '4px', fontSize: '0.75rem', opacity: 0.8 }}>
                  Latency: {item.metrics.latencyMs}ms | Cost: ${item.metrics.costUSD}
                </div>
              )}

              {/* Suggested Tools execution */}
              {item.tools && item.tools.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-accent)' }}>Suggested Actions:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.tools.map((t, tIdx) => (
                      <button
                        key={tIdx}
                        className="btn btn-accent"
                        onClick={() => executeToolCall(t)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%' }}
                      >
                        Execute {t.name === 'updateGateStatus' ? `Open ${t.params.gateId}` : t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
              Copilot is orchestrating agents...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Translation & Speech Configuration bar */}
        <div
          style={{
            padding: '8px var(--spacing-md)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            fontSize: '0.85rem'
          }}
        >
          {/* Language selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Languages size={14} />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 4px'
              }}
              aria-label="Target translation language"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Arabic</option>
              <option>Japanese</option>
            </select>
          </div>

          {/* Text to Speech toggle */}
          <button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            aria-label={isSpeaking ? "Mute Speech Synthesis" : "Unmute Speech Synthesis"}
          >
            {isSpeaking ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>TTS</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            background: 'var(--bg-card)'
          }}
        >
          {/* Speech-to-Text Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '10px' }}
            aria-label={isListening ? "Stop voice listening" : "Start voice listening"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            className="form-input"
            placeholder="Type command or query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            aria-label="AI Command query input"
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '10px' }}
            disabled={loading}
            aria-label="Send Query"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};
