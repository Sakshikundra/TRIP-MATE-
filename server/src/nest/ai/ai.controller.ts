import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { OptionalAuth } from '../auth/public.decorator';
import { AiService } from './ai.service';
import { PlanItineraryDto, ChatAiDto } from './ai.dto';

@OptionalAuth('AI planner and assistant endpoints')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus(@Query('apiKey') apiKey?: string) {
    return this.aiService.getStatus(apiKey);
  }

  @Post('plan-itinerary')
  planItinerary(@Body() dto: PlanItineraryDto) {
    return this.aiService.generateItinerary(dto);
  }

  @Post('chat')
  chat(@Body() dto: ChatAiDto) {
    return this.aiService.chat(dto);
  }
}
