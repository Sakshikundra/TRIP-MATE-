import { Injectable, BadRequestException } from '@nestjs/common';
import { readEnv } from '../../app-config';
import { PlanItineraryDto, ChatAiDto } from './ai.dto';

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

@Injectable()
export class AiService {
  private resolveKey(providedKey?: string): string | undefined {
    const fromDto = providedKey?.trim();
    if (fromDto) return fromDto;

    const fromEnv =
      readEnv().integrations.geminiApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    const trimmed = fromEnv?.trim();
    if (trimmed && trimmed !== 'your_gemini_api_key_here' && trimmed !== '••••••••') {
      return trimmed;
    }
    return undefined;
  }

  getStatus(providedKey?: string) {
    const key = this.resolveKey(providedKey);
    return {
      configured: Boolean(key),
      model: 'gemini-3.8-flash',
    };
  }

  private async callGeminiApi(apiKey: string, contents: unknown[], systemInstruction?: string): Promise<string> {
    const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: Error | null = null;

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const body: Record<string, unknown> = {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini API error (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw new BadRequestException(
      lastError?.message || 'Failed to communicate with Google Gemini API',
    );
  }

  async generateItinerary(dto: PlanItineraryDto): Promise<StructuredItinerary> {
    const apiKey = this.resolveKey(dto.apiKey);
    if (!apiKey) {
      throw new BadRequestException(
        'Gemini API key is not configured. Please add GEMINI_API_KEY in server/.env or VITE_GEMINI_API_KEY in client/.env or provide it in the settings modal.',
      );
    }

    const systemInstruction = `You are TripMate AI, an expert travel planner and local tour specialist.
Your mission is to generate a comprehensive, highly realistic day-by-day travel itinerary.
Strictly factor in:
1. Weather & Season: activities must suit the weather conditions (e.g. indoor museums for heavy rain, early morning visits for hot afternoons, thermal layers for winter).
2. Number of Days: exactly ${dto.days} distinct days.
3. Budget: realistic costs in ${dto.currency} considering the "${dto.budget}" budget level.
4. Travel Style (${dto.travelStyle}) and Interests (${dto.interests?.join(', ') || 'general sightseeing'}).

You must output BOTH a structured JSON block enclosed in \`\`\`json and \`\`\` and a readable narrative markdown itinerary.
The JSON must follow this exact shape:
{
  "summary": "Short 2-3 sentence overview of the trip",
  "weatherForecast": "Expected climate summary and seasonal advice",
  "packingTips": ["item 1", "item 2", "item 3"],
  "days": [
    {
      "dayNumber": 1,
      "title": "Title for Day 1",
      "weatherNote": "Day-specific weather advisory",
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
    { "category": "Accommodation", "name": "Hotel / Stay (${dto.days} nights)", "amount": 10000 },
    { "category": "Food & Dining", "name": "Daily meals & street food", "amount": 6000 },
    { "category": "Local Transport", "name": "Cabs, autos, transit", "amount": 3500 },
    { "category": "Activities & Entry", "name": "Tickets, guides, passes", "amount": 2500 }
  ],
  "totalEstimatedBudget": 22000
}`;

    const promptText = `Plan a ${dto.days}-day trip to ${dto.destination}.
- Duration: ${dto.days} days
- Target Budget: ${dto.budget} in ${dto.currency}
- Weather / Season: ${dto.weather}
- Travel Style: ${dto.travelStyle}
- Interests: ${dto.interests?.length ? dto.interests.join(', ') : 'Must-see attractions, local culture & food'}
${dto.startDate ? `- Start Date: ${dto.startDate}` : ''}

Please generate the complete itinerary now with both the \`\`\`json block and detailed markdown!`;

    const rawResponse = await this.callGeminiApi(
      apiKey,
      [{ role: 'user', parts: [{ text: promptText }] }],
      systemInstruction,
    );

    let parsedJson: Partial<StructuredItinerary> = {};
    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedJson = JSON.parse(jsonMatch[1]);
      } catch {
        // Fallback: try finding first { to last }
        const braceMatch = rawResponse.match(/\{[\s\S]*\}/);
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
      weatherNote: d.weatherNote ?? `Weather appropriate activities for ${dto.weather}`,
      activities: (d.activities || []).map((a) => ({
        name: a.name ?? 'Explore local sights',
        timeSlot: a.timeSlot ?? 'morning',
        time: a.time,
        duration: a.duration,
        description: a.description ?? '',
        estimatedCost: typeof a.estimatedCost === 'number' ? a.estimatedCost : 0,
        category: a.category ?? 'Sightseeing',
      })),
    }));

    // If json didn't parse days properly, fallback to skeleton
    if (days.length === 0) {
      for (let i = 1; i <= dto.days; i++) {
        days.push({
          dayNumber: i,
          title: `Day ${i}: Explore ${dto.destination}`,
          weatherNote: `Tailored for ${dto.weather} season`,
          activities: [
            {
              name: `Morning Highlights of ${dto.destination}`,
              timeSlot: 'morning',
              time: '09:00',
              duration: '3 hours',
              description: `Discover key attractions around ${dto.destination}`,
              estimatedCost: 300,
              category: 'Sightseeing',
            },
            {
              name: 'Local Culinary Experience',
              timeSlot: 'afternoon',
              time: '13:00',
              duration: '2 hours',
              description: 'Try famous regional dishes at renowned local eateries',
              estimatedCost: 500,
              category: 'Food',
            },
            {
              name: 'Evening Leisure & Sunset',
              timeSlot: 'evening',
              time: '17:30',
              duration: '2 hours',
              description: 'Relax and experience the local nightlife and markets',
              estimatedCost: 200,
              category: 'Culture',
            },
          ],
        });
      }
    }

    const budgetBreakdown: BudgetBreakdownItem[] =
      parsedJson.budgetBreakdown?.map((b) => ({
        category: b.category ?? 'General',
        name: b.name ?? 'Expenses',
        amount: Number(b.amount) || 0,
      })) || [
        { category: 'Accommodation', name: 'Stay & Hotels', amount: Math.round((dto.days * 2000)) },
        { category: 'Food', name: 'Meals & Dining', amount: Math.round((dto.days * 1000)) },
        { category: 'Transport', name: 'Local Transfers', amount: Math.round((dto.days * 600)) },
        { category: 'Activities', name: 'Sightseeing & Tickets', amount: Math.round((dto.days * 500)) },
      ];

    const totalBudget =
      parsedJson.totalEstimatedBudget ||
      budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      destination: dto.destination,
      daysCount: dto.days,
      summary: parsedJson.summary || `A curated ${dto.days}-day itinerary for ${dto.destination}.`,
      weatherForecast: parsedJson.weatherForecast || `Optimized for ${dto.weather} conditions.`,
      packingTips: parsedJson.packingTips || ['Comfortable walking shoes', 'Weather-appropriate clothing', 'Portable power bank'],
      days,
      budgetBreakdown,
      totalEstimatedBudget: totalBudget,
      currency: dto.currency || 'INR',
      markdown: rawResponse,
    };
  }

  async chat(dto: ChatAiDto): Promise<{ reply: string }> {
    const apiKey = this.resolveKey(dto.apiKey);
    if (!apiKey) {
      throw new BadRequestException(
        'Gemini API key is not configured. Add GEMINI_API_KEY in server/.env or VITE_GEMINI_API_KEY in client/.env',
      );
    }

    const contents = dto.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemInstruction = `You are TripMate AI, a friendly, knowledgeable travel assistant.
You help users plan and refine trips with specific attention to weather conditions, day counts, and budgets.
Give practical, accurate advice on destinations, local food, transport, packing, and timing.
${dto.tripContext ? `Current Trip Context: ${JSON.stringify(dto.tripContext)}` : ''}`;

    const reply = await this.callGeminiApi(apiKey, contents, systemInstruction);
    return { reply };
  }
}
