import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Wand2,
  X,
  Sun,
  CloudRain,
  Snowflake,
  CloudSun,
  Calendar,
  Wallet,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Layers,
  MessageSquare,
  KeyRound,
  RotateCcw,
  Check,
  Copy,
  Info,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import type { Trip, Day } from '../../types';
import {
  generateItinerary,
  chatWithAssistant,
  applyItineraryToTrip,
  checkAiKeyStatus,
  type StructuredItinerary,
  type ApplyProgress,
} from '../../services/aiPlannerService';
import { AiKeyModal } from './AiKeyModal';
import { useToast } from '../shared/Toast';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  days: Day[];
  onPlanApplied?: () => void;
}

const WEATHER_OPTIONS = [
  { value: 'pleasant', label: 'Pleasant / Spring', icon: CloudSun, color: '#22c55e' },
  { value: 'summer', label: 'Summer / Hot', icon: Sun, color: '#f59e0b' },
  { value: 'monsoon', label: 'Monsoon / Rainy', icon: CloudRain, color: '#6366f1' },
  { value: 'winter', label: 'Winter / Cold', icon: Snowflake, color: '#06b6d4' },
];

const BUDGET_TIERS = [
  { value: 'budget', label: 'Budget (Backpacker)', desc: 'Hostels, local transit & street food' },
  { value: 'mid', label: 'Mid-range (Comfort)', desc: '3-star hotels, cabs & good cafes' },
  { value: 'luxury', label: 'Luxury (Premium)', desc: 'Resorts, private tours & fine dining' },
];

const TRAVEL_STYLES = [
  { value: 'couple', label: 'Couple / Romance' },
  { value: 'family', label: 'Family with Kids' },
  { value: 'friends', label: 'Friends / Group' },
  { value: 'solo', label: 'Solo Explorer' },
  { value: 'backpacker', label: 'Backpacker' },
];

const INTEREST_TAGS = [
  'Must-see sights',
  'Local food & street eats',
  'Culture & heritage',
  'Nature & scenic viewpoints',
  'Adventure & hiking',
  'Shopping & local markets',
  'Relaxation & cafes',
  'Photography spots',
];

export function AiAssistantModal({
  isOpen,
  onClose,
  trip,
  days,
  onPlanApplied,
}: AiAssistantModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'plan' | 'chat'>('plan');
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ configured: boolean; source: string }>({
    configured: false,
    source: 'none',
  });

  // Planner form state
  const destinationInitial = trip.destination_name || trip.title || 'Manali';
  const daysInitial = Math.max(1, days.length || 5);
  const currencyInitial = trip.currency || 'INR';

  const [destination, setDestination] = useState(destinationInitial);
  const [daysCount, setDaysCount] = useState(daysInitial);
  const [budgetTier, setBudgetTier] = useState('mid');
  const [customBudget, setCustomBudget] = useState('');
  const [weatherSeason, setWeatherSeason] = useState('pleasant');
  const [travelStyle, setTravelStyle] = useState('couple');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Must-see sights',
    'Local food & street eats',
  ]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<StructuredItinerary | null>(null);

  // Apply state
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<ApplyProgress | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I am your **TripMate AI Assistant** for **${trip.title}**.\n\nI can build your complete day-by-day itinerary considering the **weather**, **number of days**, and **budget** — and then add it directly into your trip plan with one click!\n\nHow would you like to plan today?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkAiKeyStatus().then(setKeyStatus);
      if (trip.destination_name) setDestination(trip.destination_name);
      if (days.length) setDaysCount(days.length);
    }
  }, [isOpen, trip, days]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const budgetLabel = customBudget.trim()
        ? `${customBudget.trim()} ${currencyInitial}`
        : budgetTier;

      const result = await generateItinerary({
        destination,
        days: daysCount,
        budget: budgetLabel,
        currency: currencyInitial,
        weather: weatherSeason,
        travelStyle,
        interests: selectedInterests,
        startDate: trip.start_date || undefined,
      });

      setGeneratedItinerary(result);
      toast.success('Itinerary generated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate itinerary';
      toast.error(msg);
      if (msg.toLowerCase().includes('key')) {
        setKeyModalOpen(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToTrip = async () => {
    if (!generatedItinerary) return;
    setIsApplying(true);
    try {
      const res = await applyItineraryToTrip(trip.id, generatedItinerary, {
        createDays: true,
        addPlaces: true,
        addBudget: true,
        addWeatherNotes: true,
        onProgress: setApplyProgress,
      });

      toast.success(
        `Plan applied! Added ${res.placesAdded} places, ${res.daysAdded} days, and ${res.budgetItemsAdded} budget items.`,
      );
      onPlanApplied?.();
      setTimeout(() => {
        setIsApplying(false);
        setApplyProgress(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error('Error applying plan to trip');
      setIsApplying(false);
      setApplyProgress(null);
    }
  };

  const handleSendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isChatLoading) return;

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setChatMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: trimmed },
      { id: assistantMsgId, role: 'assistant', content: '' },
    ]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const reply = await chatWithAssistant(
        [
          ...chatMessages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: trimmed },
        ],
        {
          tripTitle: trip.title,
          destination,
          days: daysCount,
          currency: currencyInitial,
          weather: weatherSeason,
        },
      );

      setChatMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: reply } : m)),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get answer';
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `⚠️ **Error:** ${msg}\n\nPlease check your Gemini API key in settings.` }
            : m,
        ),
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(10, 10, 20, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isApplying) onClose();
      }}
    >
      <div
        className="bg-surface-primary border border-edge-subtle text-content-primary shadow-2xl"
        style={{
          width: '100%',
          maxWidth: 960,
          height: '90vh',
          maxHeight: 780,
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeScale 0.2s ease-out',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.18) 0%, rgba(247,147,30,0.06) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(255, 107, 53, 0.35)',
              }}
            >
              <Wand2 size={22} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>AI Itinerary Assistant</h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: 'rgba(255, 107, 53, 0.2)',
                    color: '#ff6b35',
                  }}
                >
                  Trip Plan
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
                {trip.title} • {daysCount} Days • Customized for Weather & Budget
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Key Status Pill */}
            <button
              type="button"
              onClick={() => setKeyModalOpen(true)}
              className="border border-edge-subtle hover:bg-surface-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: keyStatus.configured ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: keyStatus.configured ? '#22c55e' : '#ef4444',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Configure Gemini API Key"
            >
              <KeyRound size={13} />
              {keyStatus.configured ? 'Gemini Ready' : 'Set API Key'}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                opacity: 0.6,
                cursor: isApplying ? 'not-allowed' : 'pointer',
                padding: 6,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 24px',
            gap: 20,
            flexShrink: 0,
            background: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 4px',
              fontSize: 13.5,
              fontWeight: 700,
              background: 'none',
              border: 'none',
              color: activeTab === 'plan' ? '#ff6b35' : 'inherit',
              borderBottom: `2.5px solid ${activeTab === 'plan' ? '#ff6b35' : 'transparent'}`,
              cursor: 'pointer',
              opacity: activeTab === 'plan' ? 1 : 0.65,
            }}
          >
            <Sparkles size={16} /> Itinerary Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 4px',
              fontSize: 13.5,
              fontWeight: 700,
              background: 'none',
              border: 'none',
              color: activeTab === 'chat' ? '#ff6b35' : 'inherit',
              borderBottom: `2.5px solid ${activeTab === 'chat' ? '#ff6b35' : 'transparent'}`,
              cursor: 'pointer',
              opacity: activeTab === 'chat' ? 1 : 0.65,
            }}
          >
            <MessageSquare size={16} /> Chat & Refine
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {activeTab === 'plan' ? (
            <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
              {/* Left Column: Generator Form */}
              <div
                style={{
                  width: 360,
                  flexShrink: 0,
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '20px 22px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Destination */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                    Destination
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5 }} />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Manali, Goa, Jaipur, Paris"
                      className="bg-surface-secondary border border-edge-subtle"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 34px',
                        borderRadius: 12,
                        fontSize: 13.5,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Days Count */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
                      Number of Days
                    </label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#ff6b35' }}>
                      {daysCount} Days
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={daysCount}
                      onChange={(e) => setDaysCount(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#ff6b35', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[3, 5, 7, 10].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDaysCount(d)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: daysCount === d ? 700 : 500,
                            background: daysCount === d ? '#ff6b35' : 'rgba(255,255,255,0.06)',
                            color: daysCount === d ? 'white' : 'inherit',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weather & Season */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                    Weather & Season
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {WEATHER_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = weatherSeason === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setWeatherSeason(opt.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: `1.5px solid ${active ? opt.color : 'rgba(255,255,255,0.08)'}`,
                            background: active ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                            color: active ? opt.color : 'inherit',
                            fontSize: 12,
                            fontWeight: active ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Icon size={14} color={active ? opt.color : undefined} />
                          {opt.label.split(' / ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                    Budget ({currencyInitial})
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {BUDGET_TIERS.map((tier) => {
                      const active = budgetTier === tier.value && !customBudget;
                      return (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() => {
                            setBudgetTier(tier.value);
                            setCustomBudget('');
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: `1.5px solid ${active ? '#ff6b35' : 'rgba(255,255,255,0.08)'}`,
                            background: active ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                            color: active ? '#ff6b35' : 'inherit',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 600 }}>{tier.label}</div>
                          <div style={{ fontSize: 10.5, opacity: 0.65 }}>{tier.desc}</div>
                        </button>
                      );
                    })}
                    <input
                      type="text"
                      value={customBudget}
                      onChange={(e) => setCustomBudget(e.target.value)}
                      placeholder={`Or custom amount (e.g. 25000 ${currencyInitial})`}
                      className="bg-surface-secondary border border-edge-subtle"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                    Travel Style
                  </label>
                  <select
                    value={travelStyle}
                    onChange={(e) => setTravelStyle(e.target.value)}
                    className="bg-surface-secondary border border-edge-subtle"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  >
                    {TRAVEL_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interests */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                    Interests & Activities
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {INTEREST_TAGS.map((tag) => {
                      const active = selectedInterests.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: active ? 700 : 500,
                            border: `1px solid ${active ? '#ff6b35' : 'rgba(255,255,255,0.12)'}`,
                            background: active ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                            color: active ? '#ff6b35' : 'inherit',
                            cursor: 'pointer',
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!destination.trim() || isGenerating}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 14,
                    border: 'none',
                    background: destination.trim() && !isGenerating
                      ? 'linear-gradient(135deg, #ff6b35, #f7931e)'
                      : 'rgba(255,255,255,0.08)',
                    color: destination.trim() && !isGenerating ? 'white' : 'rgba(255,255,255,0.3)',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: destination.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: destination.trim() && !isGenerating ? '0 4px 16px rgba(255,107,53,0.35)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  {isGenerating ? 'Building Itinerary...' : 'Generate Itinerary with AI'}
                </button>
              </div>

              {/* Right Column: Generated Plan View */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.03)',
                }}
              >
                {generatedItinerary ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {/* Top Action Bar */}
                    <div
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>
                          Ready to apply {generatedItinerary.days.length} days & {generatedItinerary.days.reduce((s, d) => s + d.activities.length, 0)} places
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyToTrip}
                        disabled={isApplying}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 12,
                          border: 'none',
                          background: isApplying ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: isApplying ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                        }}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            {applyProgress?.step || 'Applying to Plan...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Apply Itinerary to Trip Plan
                          </>
                        )}
                      </button>
                    </div>

                    {/* Scrollable Plan Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Summary Banner */}
                      <div
                        style={{
                          padding: '16px 18px',
                          borderRadius: 16,
                          background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(247,147,30,0.05))',
                          border: '1px solid rgba(255,107,53,0.25)',
                        }}
                      >
                        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#ff6b35' }}>
                          Trip Overview
                        </h3>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{generatedItinerary.summary}</p>
                      </div>

                      {/* Weather Advisory & Budget Summary Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {/* Weather Advisory */}
                        <div
                          className="bg-surface-secondary border border-edge-subtle"
                          style={{ padding: '14px 16px', borderRadius: 14 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#06b6d4' }}>
                            <Sun size={17} />
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Weather & Packing Advisory</span>
                          </div>
                          <p style={{ margin: '0 0 8px', fontSize: 12.5, lineHeight: 1.5, opacity: 0.85 }}>
                            {generatedItinerary.weatherForecast}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {generatedItinerary.packingTips.map((tip, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  background: 'rgba(6,182,212,0.12)',
                                  color: '#06b6d4',
                                  fontWeight: 600,
                                }}
                              >
                                ✓ {tip}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Budget Breakdown */}
                        <div
                          className="bg-surface-secondary border border-edge-subtle"
                          style={{ padding: '14px 16px', borderRadius: 14 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e' }}>
                              <Wallet size={17} />
                              <span style={{ fontSize: 13, fontWeight: 700 }}>Estimated Budget</span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>
                              {generatedItinerary.currency} {generatedItinerary.totalEstimatedBudget.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {generatedItinerary.budgetBreakdown.map((b, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: 11.5,
                                  padding: '3px 0',
                                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}
                              >
                                <span style={{ opacity: 0.8 }}>{b.name}</span>
                                <span style={{ fontWeight: 700 }}>
                                  {generatedItinerary.currency} {b.amount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Day by Day Schedule */}
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7, margin: '10px 0 12px' }}>
                          Day-by-Day Itinerary Plan
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {generatedItinerary.days.map((day) => (
                            <div
                              key={day.dayNumber}
                              className="bg-surface-secondary border border-edge-subtle"
                              style={{ borderRadius: 16, overflow: 'hidden' }}
                            >
                              {/* Day Header */}
                              <div
                                style={{
                                  padding: '12px 16px',
                                  background: 'rgba(255,255,255,0.03)',
                                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      background: '#ff6b35',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 12,
                                      fontWeight: 800,
                                    }}
                                  >
                                    {day.dayNumber}
                                  </span>
                                  <span style={{ fontSize: 14, fontWeight: 700 }}>{day.title}</span>
                                </div>
                                {day.weatherNote && (
                                  <span style={{ fontSize: 11.5, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CloudSun size={13} color="#f59e0b" /> {day.weatherNote}
                                  </span>
                                )}
                              </div>

                              {/* Activities List */}
                              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {day.activities.map((act, actIdx) => (
                                  <div
                                    key={actIdx}
                                    style={{
                                      display: 'flex',
                                      gap: 12,
                                      alignItems: 'flex-start',
                                      padding: '8px 10px',
                                      borderRadius: 10,
                                      background: 'rgba(255,255,255,0.02)',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        padding: '2px 6px',
                                        borderRadius: 6,
                                        background:
                                          act.timeSlot === 'morning'
                                            ? 'rgba(245,158,11,0.15)'
                                            : act.timeSlot === 'afternoon'
                                            ? 'rgba(99,102,241,0.15)'
                                            : 'rgba(236,72,153,0.15)',
                                        color:
                                          act.timeSlot === 'morning'
                                            ? '#f59e0b'
                                            : act.timeSlot === 'afternoon'
                                            ? '#818cf8'
                                            : '#ec4899',
                                        minWidth: 65,
                                        textAlign: 'center',
                                      }}
                                    >
                                      {act.timeSlot}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700 }}>{act.name}</span>
                                        {act.estimatedCost ? (
                                          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#22c55e' }}>
                                            ~{generatedItinerary.currency} {act.estimatedCost}
                                          </span>
                                        ) : null}
                                      </div>
                                      <p style={{ margin: '3px 0 0', fontSize: 12, opacity: 0.8, lineHeight: 1.45 }}>
                                        {act.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Placeholder when no itinerary generated yet */
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 32,
                      textAlign: 'center',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 24,
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(247,147,30,0.05))',
                        border: '1.5px dashed rgba(255,107,53,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={32} color="#ff6b35" />
                    </div>
                    <div style={{ maxWidth: 360 }}>
                      <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Customize & Generate</h3>
                      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
                        Select your destination, days, weather, and budget on the left, then click <strong>"Generate Itinerary with AI"</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Chat Tab */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Messages Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        flexShrink: 0,
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : 'linear-gradient(135deg, #ff6b35, #f7931e)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      }}
                    >
                      <Bot size={16} color="white" />
                    </div>
                    <div
                      style={{
                        maxWidth: '82%',
                        background:
                          msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                        border:
                          msg.role === 'user'
                            ? '1px solid rgba(99,102,241,0.3)'
                            : '1px solid rgba(255,255,255,0.08)',
                        borderRadius:
                          msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '12px 16px',
                        fontSize: 13.5,
                        lineHeight: 1.6,
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      {msg.role === 'assistant' && msg.id !== 'welcome' && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => copyText(msg.id, msg.content)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              opacity: 0.6,
                              cursor: 'pointer',
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {copiedId === msg.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                            {copiedId === msg.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        background: 'linear-gradient(135deg,#ff6b35,#f7931e)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bot size={16} color="white" />
                    </div>
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12.5,
                        opacity: 0.8,
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" /> Thinking & planning...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div
                style={{
                  padding: '8px 24px',
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.05)',
                }}
              >
                {[
                  `What should I pack for ${weatherSeason}?`,
                  `Suggest food to try in ${destination}`,
                  `Budget-friendly activities in ${destination}`,
                  `How to commute locally in ${destination}?`,
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendChat(q)}
                    disabled={isChatLoading}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 14,
                      fontSize: 11.5,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'inherit',
                      whiteSpace: 'nowrap',
                      cursor: isChatLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div
                style={{
                  padding: '12px 24px 18px',
                  background: 'rgba(0,0,0,0.08)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat(chatInput);
                  }}
                  placeholder={`Ask TripMate about ${destination}, weather, budget tips...`}
                  className="bg-surface-secondary border border-edge-subtle"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 14,
                    fontSize: 13.5,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSendChat(chatInput)}
                  disabled={!chatInput.trim() || isChatLoading}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: 'none',
                    background: chatInput.trim() && !isChatLoading
                      ? 'linear-gradient(135deg, #ff6b35, #f7931e)'
                      : 'rgba(255,255,255,0.08)',
                    color: chatInput.trim() && !isChatLoading ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: chatInput.trim() && !isChatLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Modal */}
      <AiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onKeySaved={() => checkAiKeyStatus().then(setKeyStatus)}
      />
    </div>
  );
}
