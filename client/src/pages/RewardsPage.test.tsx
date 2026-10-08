import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const { rewardsApi, toast } = vi.hoisted(() => ({
  rewardsApi: {
    me: vi.fn(),
    leaderboard: vi.fn(),
    catalog: vi.fn(),
    redeem: vi.fn(),
  },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../api/client', () => ({ rewardsApi }))
vi.mock('../components/Layout/Navbar', () => ({ default: () => <nav /> }))
vi.mock('../components/shared/Toast', () => ({ useToast: () => toast }))
vi.mock('../i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  translateApiError: (_t: unknown, _error: unknown, key: string) => key,
}))
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { id: number } }) => unknown) => selector({ user: { id: 7 } }),
}))

import RewardsPage from './RewardsPage'

describe('RewardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rewardsApi.me.mockResolvedValue({ points: 120, ledger: [] })
    rewardsApi.leaderboard.mockResolvedValue({
      leaderboard: [
        { rank: 1, user_id: 7, username: 'traveler', points: 120 },
        { rank: 2, user_id: 8, username: 'another', points: 80 },
      ],
    })
    rewardsApi.catalog.mockResolvedValue({
      points: 120,
      rewards: [
        { id: 1, name: '5% hotel discount', points_required: 100 },
        { id: 2, name: '10% cashback coupon', points_required: 250 },
      ],
    })
    rewardsApi.redeem.mockResolvedValue({
      couponCode: 'TREK-0123456789',
      rewardName: '5% hotel discount',
      pointsSpent: 100,
      balance: 20,
    })
  })

  it('shows points, highlights the current user, and displays the redeemed coupon', async () => {
    render(<RewardsPage />)

    expect((await screen.findAllByText('120')).length).toBeGreaterThan(0)
    expect(screen.getByText('traveler (you)')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Redeem' }))

    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByText('TREK-0123456789')).toBeTruthy()
    await waitFor(() => expect(rewardsApi.redeem).toHaveBeenCalledWith(1))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows a retry action when loading the rewards API fails', async () => {
    rewardsApi.me.mockRejectedValue(new Error('offline'))
    render(<RewardsPage />)

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})
