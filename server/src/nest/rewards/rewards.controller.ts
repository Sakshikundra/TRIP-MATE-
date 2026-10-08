import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { RewardRedeemDto } from './rewards.dto';
import { RewardsService } from './rewards.service';

@Controller('api/rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get('leaderboard')
  leaderboard(@CurrentUser() user: User) {
    return this.rewards.getLeaderboard(user.id);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.rewards.getMe(user.id);
  }

  @Get('catalog')
  catalog(@CurrentUser() user: User) {
    return this.rewards.getCatalog(user.id);
  }

  @Post('redeem')
  @HttpCode(200)
  redeem(@CurrentUser() user: User, @Body() body: RewardRedeemDto) {
    return this.rewards.redeem(user.id, body.rewardId);
  }

  @Post('trips/:tripId/complete')
  @UseGuards(TripAccessGuard)
  @RequirePermission('trip_edit')
  @HttpCode(200)
  completeTrip(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return this.rewards.award(user.id, tripId, 'TRIP_COMPLETED');
  }
}
