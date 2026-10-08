import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.service';

export type RewardAction = 'TRIP_CREATED' | 'DAY_PLANNED' | 'TRIP_COMPLETED';

const ACTION_POINTS: Record<RewardAction, number> = {
  TRIP_CREATED: 10,
  DAY_PLANNED: 5,
  TRIP_COMPLETED: 50,
};

@Injectable()
export class RewardsService {
  constructor(private readonly dbs: DatabaseService) {}

  private get db() {
    return this.dbs.connection;
  }

  private balance(userId: number): number {
    const row = this.db
      .prepare('SELECT COALESCE(SUM(points), 0) AS points FROM points_ledger WHERE user_id = ?')
      .get(userId) as { points: number };
    return row.points;
  }

  award(userId: number, tripId: number | string, action: RewardAction) {
    const bonus =
      action === 'TRIP_COMPLETED' && this.tripMemberCount(tripId) >= 3 ? 20 : 0;
    const points = ACTION_POINTS[action] + bonus;
    const result = this.db
      .prepare(
        'INSERT OR IGNORE INTO points_ledger (user_id, trip_id, action, points) VALUES (?, ?, ?, ?)',
      )
      .run(userId, tripId, action, points);
    return {
      pointsAwarded: result.changes > 0 ? points : 0,
      alreadyAwarded: result.changes === 0,
      balance: this.balance(userId),
    };
  }

  private tripMemberCount(tripId: number | string): number {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS count FROM (
          SELECT user_id FROM trip_members WHERE trip_id = ?
          UNION
          SELECT user_id FROM trips WHERE id = ?
        )`,
      )
      .get(tripId, tripId) as { count: number };
    return row.count;
  }

  getMe(userId: number) {
    const ledger = this.db
      .prepare(
        `SELECT id, trip_id, action, points, created_at
         FROM points_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
      )
      .all(userId);
    return { points: this.balance(userId), ledger };
  }

  getLeaderboard(userId: number) {
    const leaderboard = this.db
      .prepare(
        `WITH totals AS (
           SELECT user_id, SUM(points) AS points
           FROM points_ledger
           GROUP BY user_id
           HAVING SUM(points) > 0
         ), ranked AS (
           SELECT ROW_NUMBER() OVER (ORDER BY totals.points DESC, users.username COLLATE NOCASE) AS rank,
                  users.id AS user_id, users.username, totals.points
           FROM totals JOIN users ON users.id = totals.user_id
         )
         SELECT rank, user_id, username, points
         FROM ranked
         WHERE rank <= 100 OR user_id = ?
         ORDER BY rank`,
      )
      .all(userId);
    return { leaderboard };
  }

  getCatalog(userId: number) {
    const rewards = this.db
      .prepare('SELECT id, name, points_required FROM rewards ORDER BY points_required, id')
      .all();
    return { points: this.balance(userId), rewards };
  }

  redeem(userId: number, rewardId: number) {
    return this.db.transaction(() => {
      const reward = this.db
        .prepare('SELECT id, name, points_required FROM rewards WHERE id = ?')
        .get(rewardId) as { id: number; name: string; points_required: number } | undefined;
      if (!reward) throw new NotFoundException('Reward not found');

      const balance = this.balance(userId);
      if (balance < reward.points_required) {
        throw new BadRequestException('Not enough points to redeem this reward');
      }

      const couponCode = `TREK-${randomBytes(5).toString('hex').toUpperCase()}`;
      const userReward = this.db
        .prepare(
          'INSERT INTO user_rewards (user_id, reward_id, coupon_code, redeemed_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        )
        .run(userId, reward.id, couponCode);
      this.db
        .prepare(
          'INSERT INTO points_ledger (user_id, trip_id, action, points) VALUES (?, NULL, ?, ?)',
        )
        .run(userId, `REDEEM:${Number(userReward.lastInsertRowid)}`, -reward.points_required);

      return {
        couponCode,
        rewardName: reward.name,
        pointsSpent: reward.points_required,
        balance: this.balance(userId),
      };
    })();
  }
}
