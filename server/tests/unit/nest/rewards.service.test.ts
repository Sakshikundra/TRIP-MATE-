import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    testDb: db,
    dbMock: { db, closeDb: () => {}, reinitialize: () => {} },
  };
});

vi.mock('../../../src/db/database', () => dbMock);

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RewardsService } from '../../../src/nest/rewards/rewards.service';
import { createTrip, createUser } from '../../helpers/factories';

const rewards = new RewardsService(new DatabaseService(testDb));

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('RewardsService', () => {
  it('awards each action once per user and trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    expect(rewards.award(user.id, trip.id, 'TRIP_CREATED')).toMatchObject({
      pointsAwarded: 10,
      alreadyAwarded: false,
      balance: 10,
    });
    expect(rewards.award(user.id, trip.id, 'TRIP_CREATED')).toMatchObject({
      pointsAwarded: 0,
      alreadyAwarded: true,
      balance: 10,
    });
    expect(rewards.award(user.id, trip.id, 'DAY_PLANNED').balance).toBe(15);
  });

  it('adds the completion member bonus for trips with at least three members', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const { user: second } = createUser(testDb);
    const { user: third } = createUser(testDb);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?), (?, ?)')
      .run(trip.id, second.id, trip.id, third.id);

    expect(rewards.award(user.id, trip.id, 'TRIP_COMPLETED')).toMatchObject({
      pointsAwarded: 70,
      alreadyAwarded: false,
      balance: 70,
    });
  });

  it('redeems points atomically and returns a coupon code', () => {
    const { user } = createUser(testDb);
    const firstTrip = createTrip(testDb, user.id);
    const secondTrip = createTrip(testDb, user.id);
    rewards.award(user.id, firstTrip.id, 'TRIP_CREATED');
    rewards.award(user.id, firstTrip.id, 'TRIP_COMPLETED');
    rewards.award(user.id, secondTrip.id, 'TRIP_CREATED');
    rewards.award(user.id, secondTrip.id, 'TRIP_COMPLETED');
    const reward = testDb.prepare('SELECT id FROM rewards WHERE points_required = 100').get() as { id: number };

    const redeemed = rewards.redeem(user.id, reward.id);

    expect(redeemed).toMatchObject({
      rewardName: '5% hotel discount',
      pointsSpent: 100,
      balance: 20,
    });
    expect(redeemed.couponCode).toMatch(/^TREK-[A-F0-9]{10}$/);
    expect(rewards.getMe(user.id).points).toBe(20);
    expect(testDb.prepare('SELECT coupon_code FROM user_rewards WHERE user_id = ?').get(user.id))
      .toEqual({ coupon_code: redeemed.couponCode });
  });
});
