import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const planItinerarySchema = z.object({
  destination: z.string().min(1),
  days: z.coerce.number().int().min(1).max(30).default(5),
  budget: z.string().default('mid'),
  currency: z.string().default('INR'),
  weather: z.string().default('pleasant'),
  travelStyle: z.string().default('couple'),
  interests: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  apiKey: z.string().optional(),
});

export class PlanItineraryDto extends createZodDto(planItinerarySchema) {}

export const chatAiSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'model', 'system']),
      content: z.string(),
    }),
  ),
  tripContext: z.record(z.string(), z.unknown()).optional(),
  apiKey: z.string().optional(),
});

export class ChatAiDto extends createZodDto(chatAiSchema) {}
