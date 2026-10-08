import { z } from 'zod';

export const rewardRedeemRequestSchema = z.object({
  rewardId: z.number().int().positive(),
});
export type RewardRedeemRequest = z.infer<typeof rewardRedeemRequestSchema>;

export const rewardsMeResponseSchema = z.object({
  points: z.number(),
  ledger: z.array(
    z.object({
      id: z.number(),
      trip_id: z.number().nullable(),
      action: z.string(),
      points: z.number(),
      created_at: z.string(),
    }),
  ),
});
export type RewardsMeResponse = z.infer<typeof rewardsMeResponseSchema>;

export const rewardsLeaderboardResponseSchema = z.object({
  leaderboard: z.array(
    z.object({
      rank: z.number(),
      user_id: z.number(),
      username: z.string(),
      points: z.number(),
    }),
  ),
});
export type RewardsLeaderboardResponse = z.infer<typeof rewardsLeaderboardResponseSchema>;

export const rewardsCatalogResponseSchema = z.object({
  points: z.number(),
  rewards: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      points_required: z.number(),
    }),
  ),
});
export type RewardsCatalogResponse = z.infer<typeof rewardsCatalogResponseSchema>;

export const rewardRedeemResponseSchema = z.object({
  couponCode: z.string(),
  rewardName: z.string(),
  pointsSpent: z.number(),
  balance: z.number(),
});
export type RewardRedeemResponse = z.infer<typeof rewardRedeemResponseSchema>;

export const tripCompletionResponseSchema = z.object({
  pointsAwarded: z.number(),
  alreadyAwarded: z.boolean(),
  balance: z.number(),
});
export type TripCompletionResponse = z.infer<typeof tripCompletionResponseSchema>;
