import React, { useState, useEffect } from 'react';
import { KeyRound, Check, X, ExternalLink, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, checkAiKeyStatus } from '../../services/aiPlannerService';

interface AiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export function AiKeyModal({ isOpen, onClose, onKeySaved }: AiKeyModalProps) {
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState<{ configured: boolean; source: string }>({ configured: false, source: 'none' });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey() || '';
      setKeyInput(stored.startsWith('••••') ? '' : stored);
      checkAiKeyStatus().then(setStatus);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (keyInput.trim()) {
      setStoredApiKey(keyInput.trim());
      setSavedSuccess(true);
      checkAiKeyStatus().then(setStatus);
      onKeySaved?.();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setKeyInput('');
    checkAiKeyStatus().then(setStatus);
    onKeySaved?.();
  };

  const sourceLabels: Record<string, string> = {
    local: 'Configured via browser storage',
    vite_env: 'Configured in client/.env (VITE_GEMINI_API_KEY)',
    server_env: 'Configured in server/.env (GEMINI_API_KEY)',
    none: 'Not configured yet',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface-primary border border-edge-subtle text-content-primary shadow-2xl"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 20,
          overflow: 'hidden',
          animation: 'fadeScale 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(247, 147, 30, 0.05))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.35)',
              }}
            >
              <KeyRound size={20} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Google Gemini API Key</h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Power your AI travel itinerary planner</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              opacity: 0.6,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Status Pill */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: status.configured ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${status.configured ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {status.configured ? (
                <ShieldCheck size={18} color="#22c55e" />
              ) : (
                <AlertCircle size={18} color="#ef4444" />
              )}
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {status.configured ? 'API Key Active' : 'API Key Missing'}
              </span>
            </div>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{sourceLabels[status.source] || status.source}</span>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                opacity: 0.8,
              }}
            >
              Enter API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="bg-surface-secondary border border-edge-subtle"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 12,
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {/* Setup Instructions */}
          <div
            className="bg-surface-secondary border border-edge-faint"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              fontSize: 12,
              lineHeight: 1.5,
              opacity: 0.85,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>You can provide the key in 3 ways:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>
                In <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 4 }}>server/.env</code> as <code style={{ color: '#ff6b35' }}>GEMINI_API_KEY=...</code>
              </li>
              <li>
                In <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 4 }}>client/.env</code> as <code style={{ color: '#ff6b35' }}>VITE_GEMINI_API_KEY=...</code>
              </li>
              <li>Or paste it directly above to save in this browser</li>
            </ul>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              color: '#ff6b35',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ExternalLink size={14} /> Get a free Gemini API key at Google AI Studio
          </a>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {status.source === 'local' && (
              <button
                type="button"
                onClick={handleClear}
                className="border border-edge-subtle"
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!keyInput.trim()}
              style={{
                flex: 1,
                padding: '11px 18px',
                borderRadius: 12,
                border: 'none',
                background: keyInput.trim()
                  ? 'linear-gradient(135deg, #ff6b35, #f7931e)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: keyInput.trim() ? 'white' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: keyInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: keyInput.trim() ? '0 4px 14px rgba(255, 107, 53, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Save API Key
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
