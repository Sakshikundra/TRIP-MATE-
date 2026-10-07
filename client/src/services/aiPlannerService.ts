import { apiClient, daysApi, placesApi, assignmentsApi, budgetApi, dayNotesApi, tripsApi } from '../api/client';
import type { Trip, Day, Place } from '../types';

export interface ItineraryActivity {
  name: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  time?: string;
  duration?: string;
  description: string;
  estimatedCost?: number;
  category?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  weatherNote: string;
  activities: ItineraryActivity[];
}

export interface BudgetBreakdownItem {
  category: string;
  name: string;
  amount: number;
}

export interface StructuredItinerary {
  destination: string;
  daysCount: number;
  summary: string;
  weatherForecast: string;
  packingTips: string[];
  days: ItineraryDay[];
  budgetBreakdown: BudgetBreakdownItem[];
  totalEstimatedBudget: number;
  currency: string;
  markdown: string;
}

export interface ItineraryRequest {
  destination: string;
  days: number;
  budget: string;
  currency?: string;
  weather?: string;
  travelStyle?: string;
  interests?: string[];
  startDate?: string;
}

const LOCAL_STORAGE_KEY = 'gemini_api_key';

export function getStoredApiKey(): string | null {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY)?.trim();
  if (local) return local;

  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey && envKey !== 'your_gemini_api_key_here' && envKey !== '••••••••') {
    return envKey;
  }
  return null;
}

export function setStoredApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(LOCAL_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export async function checkAiKeyStatus(): Promise<{
  configured: boolean;
  source: 'local' | 'vite_env' | 'server_env' | 'none';
}> {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY)?.trim();
  if (local) return { configured: true, source: 'local' };

  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey && envKey !== 'your_gemini_api_key_here' && envKey !== '••••••••') {
    return { configured: true, source: 'vite_env' };
  }

  try {
    const res = await apiClient.get('/ai/status');
    if (res.data?.configured) {
      return { configured: true, source: 'server_env' };
    }
  } catch {
    // server check failed or unauthenticated
  }

  return { configured: false, source: 'none' };
}

/**
 * Direct Gemini API call from client with streaming
 */
async function callDirectGemini(
  apiKey: string,
  messages: Array<{ role: string; parts: { text: string }[] }>,
  systemInstruction: string,
  onChunk?: (text: string) => void,
): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${onChunk ? 'streamGenerateContent?alt=sse&' : 'generateContent?'}key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${model} error (${res.status}): ${err}`);
      }

      if (onChunk && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                full += text;
                onChunk(text);
              }
            } catch {
              // ignore json partial parse
            }
          }
        }
        return full;
      } else {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Failed to reach Gemini API');
}

export function parseItineraryText(
  rawText: string,
  params: ItineraryRequest,
): StructuredItinerary {
  let parsedJson: Partial<StructuredItinerary> = {};
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      parsedJson = JSON.parse(jsonMatch[1]);
    } catch {
      const braceMatch = rawText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          parsedJson = JSON.parse(braceMatch[0]);
        } catch {
          parsedJson = {};
        }
      }
    }
  }

  const days: ItineraryDay[] = (parsedJson.days || []).map((d, index) => ({
    dayNumber: d.dayNumber ?? index + 1,
    title: d.title ?? `Day ${index + 1}`,
    weatherNote: d.weatherNote ?? `Weather-appropriate plan for ${params.weather || 'current'} season`,
    activities: (d.activities || []).map((a) => ({
      name: a.name ?? 'Scenic Exploration',
      timeSlot: a.timeSlot ?? 'morning',
      time: a.time,
      duration: a.duration,
      description: a.description ?? '',
      estimatedCost: typeof a.estimatedCost === 'number' ? a.estimatedCost : 0,
      category: a.category ?? 'Sightseeing',
    })),
  }));

  if (days.length === 0) {
    for (let i = 1; i <= params.days; i++) {
      days.push({
        dayNumber: i,
        title: `Day ${i}: Discover ${params.destination}`,
        weatherNote: `Tailored for ${params.weather || 'pleasant'} weather`,
        activities: [
          {
            name: `Highlights of ${params.destination}`,
            timeSlot: 'morning',
            time: '09:00',
            duration: '3 hours',
            description: `Visit top attractions and landmarks in ${params.destination}`,
            estimatedCost: 350,
            category: 'Sightseeing',
          },
          {
            name: 'Local Food & Heritage Tour',
            timeSlot: 'afternoon',
            time: '13:00',
            duration: '2.5 hours',
            description: 'Taste authentic local delicacies and visit cultural hotspots',
            estimatedCost: 600,
            category: 'Food',
          },
          {
            name: 'Evening Promenade & Sunset',
            timeSlot: 'evening',
            time: '17:30',
            duration: '2 hours',
            description: 'Scenic viewpoint, local evening market and dinner',
            estimatedCost: 300,
            category: 'Culture',
          },
        ],
      });
    }
  }

  const budgetBreakdown: BudgetBreakdownItem[] =
    parsedJson.budgetBreakdown?.map((b) => ({
      category: b.category ?? 'General',
      name: b.name ?? 'Expense',
      amount: Number(b.amount) || 0,
    })) || [
      { category: 'Accommodation', name: 'Stay & Hotels', amount: params.days * 2500 },
      { category: 'Food & Dining', name: 'Meals & Dining', amount: params.days * 1200 },
      { category: 'Local Transport', name: 'Local Transfers & Cabs', amount: params.days * 800 },
      { category: 'Activities & Entry', name: 'Sightseeing & Entry Passes', amount: params.days * 600 },
    ];

  const totalBudget =
    parsedJson.totalEstimatedBudget ||
    budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

  return {
    destination: params.destination,
    daysCount: params.days,
    summary: parsedJson.summary || `A comprehensive ${params.days}-day plan for ${params.destination}.`,
    weatherForecast: parsedJson.weatherForecast || `Comfortable planning for ${params.weather || 'seasonal'} conditions.`,
    packingTips: parsedJson.packingTips || [
      'Comfortable walking shoes',
      'Weather-appropriate layers and rain/sun protection',
      'Portable charger & refillable water bottle',
    ],
    days,
    budgetBreakdown,
    totalEstimatedBudget: totalBudget,
    currency: params.currency || 'INR',
    markdown: rawText,
  };
}

export async function generateItinerary(
  params: ItineraryRequest,
  onChunk?: (chunk: string) => void,
): Promise<StructuredItinerary> {
  const localKey = getStoredApiKey();

  const systemInstruction = `You are TripMate AI, an expert travel planner and local tour specialist.
Your mission is to generate a comprehensive, highly realistic day-by-day travel itinerary.
Strictly factor in:
1. Weather & Season (${params.weather || 'pleasant'}): activities must explicitly fit the weather (indoor options during rain, shaded or early morning visits during hot afternoons, warm layers for winter/snow).
2. Number of Days: exactly ${params.days} days.
3. Budget (${params.budget} in ${params.currency || 'INR'}): realistic costs for meals, stays, transit, and entry tickets.
4. Travel Style (${params.travelStyle || 'couple'}) and Interests (${params.interests?.join(', ') || 'sightseeing, food, culture'}).

You must output BOTH a structured JSON block enclosed in \`\`\`json and \`\`\` AND an engaging, readable markdown itinerary.
The JSON must follow this exact shape:
{
  "summary": "Short 2-3 sentence overview of the trip",
  "weatherForecast": "Expected climate summary and seasonal advice",
  "packingTips": ["item 1", "item 2", "item 3"],
  "days": [
    {
      "dayNumber": 1,
      "title": "Title for Day 1",
      "weatherNote": "Day-specific weather advisory and clothing tip",
      "activities": [
        {
          "name": "Specific place or landmark name",
          "timeSlot": "morning",
          "time": "09:00",
          "duration": "2.5 hours",
          "description": "Engaging description of activity",
          "estimatedCost": 500,
          "category": "Sightseeing"
        },
        {
          "name": "Lunch spot / afternoon place",
          "timeSlot": "afternoon",
          "time": "13:00",
          "duration": "2 hours",
          "description": "Local food and exploration",
          "estimatedCost": 700,
          "category": "Food"
        },
        {
          "name": "Evening viewpoint or market",
          "timeSlot": "evening",
          "time": "17:30",
          "duration": "2.5 hours",
          "description": "Sunset view and evening stroll",
          "estimatedCost": 200,
          "category": "Culture"
        }
      ]
    }
  ],
  "budgetBreakdown": [
    { "category": "Accommodation", "name": "Hotel / Stay (${params.days} nights)", "amount": 10000 },
    { "category": "Food & Dining", "name": "Daily meals & street food", "amount": 6000 },
    { "category": "Local Transport", "name": "Cabs, autos, transit", "amount": 3500 },
    { "category": "Activities & Entry", "name": "Tickets, guides, passes", "amount": 2500 }
  ],
  "totalEstimatedBudget": 22000
}`;

  const promptText = `Plan a ${params.days}-day trip to ${params.destination}.
- Duration: ${params.days} days
- Target Budget: ${params.budget} in ${params.currency || 'INR'}
- Weather / Season: ${params.weather || 'pleasant'}
- Travel Style: ${params.travelStyle || 'couple'}
- Interests: ${params.interests?.length ? params.interests.join(', ') : 'Must-see attractions, local cuisine & culture'}
${params.startDate ? `- Start Date: ${params.startDate}` : ''}

Please generate the complete itinerary now with both the \`\`\`json block and detailed markdown!`;

  if (localKey) {
    const raw = await callDirectGemini(
      localKey,
      [{ role: 'user', parts: [{ text: promptText }] }],
      systemInstruction,
      onChunk,
    );
    return parseItineraryText(raw, params);
  }

  // Fallback to server endpoint
  try {
    const res = await apiClient.post('/ai/plan-itinerary', {
      ...params,
      apiKey: localKey || undefined,
    });
    const itinerary = res.data as StructuredItinerary;
    if (onChunk && itinerary.markdown) {
      onChunk(itinerary.markdown);
    }
    return itinerary;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    throw new Error(
      msg ||
        'Gemini API key is not configured. Please add GEMINI_API_KEY in server/.env or VITE_GEMINI_API_KEY in client/.env, or set it via the API key button.',
    );
  }
}

export async function chatWithAssistant(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  tripContext?: Record<string, unknown>,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const localKey = getStoredApiKey();

  const systemInstruction = `You are TripMate AI, a friendly, knowledgeable Indian and global travel assistant.
You help users plan and refine trips with specific attention to weather conditions, day counts, and budgets.
Give practical, accurate advice on destinations, local food, transport, packing, and timing.
${tripContext ? `Current Trip Context: ${JSON.stringify(tripContext)}` : ''}`;

  if (localKey) {
    const formatted = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    return callDirectGemini(localKey, formatted, systemInstruction, onChunk);
  }

  // Fallback to server endpoint
  try {
    const res = await apiClient.post('/ai/chat', {
      messages,
      tripContext,
      apiKey: localKey || undefined,
    });
    const reply = (res.data?.reply as string) || '';
    if (onChunk) onChunk(reply);
    return reply;
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    throw new Error(
      msg ||
        'Gemini API key is not configured. Add GEMINI_API_KEY to server/.env or VITE_GEMINI_API_KEY to client/.env.',
    );
  }
}

export interface ApplyProgress {
  step: string;
  percent: number;
}

/**
 * Apply the generated itinerary directly into a trip's plan!
 * Adds days, places, place assignments to days, weather notes, and budget items.
 */
export async function applyItineraryToTrip(
  tripId: number,
  itinerary: StructuredItinerary,
  options: {
    createDays?: boolean;
    addPlaces?: boolean;
    addBudget?: boolean;
    addWeatherNotes?: boolean;
    onProgress?: (progress: ApplyProgress) => void;
  } = {},
): Promise<{ daysAdded: number; placesAdded: number; budgetItemsAdded: number }> {
  const {
    createDays = true,
    addPlaces = true,
    addBudget = true,
    addWeatherNotes = true,
    onProgress,
  } = options;

  let daysAdded = 0;
  let placesAdded = 0;
  let budgetItemsAdded = 0;

  onProgress?.({ step: 'Loading trip days...', percent: 10 });

  // 1. Get or create days
  let existingDays: Day[] = [];
  try {
    const daysRes = await daysApi.list(tripId);
    existingDays = (daysRes?.days || daysRes || []) as Day[];
  } catch {
    existingDays = [];
  }

  const sortedDays = [...existingDays].sort(
    (a, b) => (a.day_number ?? 0) - (b.day_number ?? 0),
  );

  const neededDaysCount = itinerary.days.length;
  const daysMap: Record<number, Day> = {};

  // Map existing days by 1-based index
  sortedDays.forEach((d, i) => {
    daysMap[i + 1] = d;
  });

  if (createDays && sortedDays.length < neededDaysCount) {
    const toCreate = neededDaysCount - sortedDays.length;
    for (let i = 0; i < toCreate; i++) {
      const dayNum = sortedDays.length + i + 1;
      onProgress?.({
        step: `Adding Day ${dayNum}...`,
        percent: 10 + Math.round((i / toCreate) * 20),
      });
      try {
        const newDayRes = await daysApi.create(tripId, {
          position: dayNum,
          notes: itinerary.days[dayNum - 1]?.weatherNote || undefined,
        });
        const createdDay = newDayRes?.day || newDayRes;
        daysMap[dayNum] = createdDay;
        daysAdded++;
      } catch (err) {
        console.warn(`Could not create day ${dayNum}:`, err);
      }
    }
  }

  // 2. Add places and assign to days
  if (addPlaces) {
    let activityCount = 0;
    const totalActivities = itinerary.days.reduce(
      (sum, d) => sum + d.activities.length,
      0,
    );

    for (const dayPlan of itinerary.days) {
      const targetDay = daysMap[dayPlan.dayNumber];
      const targetDayId = targetDay?.id;

      for (const act of dayPlan.activities) {
        activityCount++;
        onProgress?.({
          step: `Adding place: ${act.name}...`,
          percent: 30 + Math.round((activityCount / Math.max(1, totalActivities)) * 40),
        });

        try {
          // Create place
          const placeRes = await placesApi.create(tripId, {
            name: act.name,
            description: `${act.time ? `[${act.time}] ` : ''}${act.description}`,
            address: itinerary.destination,
            notes: act.duration ? `Duration: ${act.duration}` : undefined,
          });
          const createdPlace = placeRes?.place || (placeRes as unknown as Place);
          placesAdded++;

          // Assign to day if day exists
          if (targetDayId && createdPlace?.id) {
            await assignmentsApi.create(tripId, targetDayId, {
              place_id: createdPlace.id,
              notes: act.time ? `Scheduled: ${act.time}` : undefined,
            });
          }
        } catch (err) {
          console.warn(`Error adding place ${act.name}:`, err);
        }
      }

      // Add weather note to the day
      if (addWeatherNotes && targetDayId && dayPlan.weatherNote) {
        try {
          await dayNotesApi.create(tripId, targetDayId, {
            text: `☀️ Weather: ${dayPlan.weatherNote}`.slice(0, 500),
            icon: 'Sun',
          });
        } catch {
          // ignore day note failure
        }
      }
    }
  }

  // 3. Add budget items
  if (addBudget && itinerary.budgetBreakdown?.length) {
    onProgress?.({ step: 'Adding budget estimates...', percent: 80 });
    for (const item of itinerary.budgetBreakdown) {
      try {
        await budgetApi.create(tripId, {
          name: item.name,
          category: item.category,
          total_price: item.amount,
          currency: itinerary.currency || 'INR',
        });
        budgetItemsAdded++;
      } catch (err) {
        console.warn(`Error adding budget item ${item.name}:`, err);
      }
    }
  }

  onProgress?.({ step: 'Complete!', percent: 100 });
  return { daysAdded, placesAdded, budgetItemsAdded };
}

/**
 * Creates a brand new Trip in TREK and applies the itinerary to it!
 */
export async function createNewTripFromItinerary(
  itinerary: StructuredItinerary,
  startDate?: string,
  onProgress?: (progress: ApplyProgress) => void,
): Promise<Trip> {
  onProgress?.({ step: `Creating new trip for ${itinerary.destination}...`, percent: 5 });

  const title = `Trip to ${itinerary.destination}`;
  const tripRes = await tripsApi.create({
    title,
    destination_name: itinerary.destination,
    currency: itinerary.currency || 'INR',
    start_date: startDate || undefined,
  });

  const trip = (tripRes?.trip || tripRes) as Trip;

  await applyItineraryToTrip(trip.id, itinerary, {
    createDays: true,
    addPlaces: true,
    addBudget: true,
    addWeatherNotes: true,
    onProgress,
  });

  return trip;
}
