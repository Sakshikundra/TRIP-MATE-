import { createZodDto } from 'nestjs-zod';
import { rewardRedeemRequestSchema } from '@trek/shared';

export class RewardRedeemDto extends createZodDto(rewardRedeemRequestSchema) {}
