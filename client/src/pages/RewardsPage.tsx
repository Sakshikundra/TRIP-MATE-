import { Award, Loader2, Trophy, X } from 'lucide-react'
import Navbar from '../components/Layout/Navbar'
import { useRewards } from './rewards/useRewards'

export default function RewardsPage(): React.ReactElement {
  const {
    me,
    leaderboard,
    catalog,
    isLoading,
    error,
    userId,
    redeemingId,
    coupon,
    closeCoupon,
    redeem,
    reload,
  } = useRewards()

  return (
    <div className="min-h-screen bg-surface-base text-content">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-[calc(var(--nav-h)+24px)] sm:px-6">
        <header className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">Rewards & Leaderboard</h1>
            <p className="text-sm text-content-muted">Earn points as you plan and complete trips.</p>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-edge bg-surface-card p-4">
            <p>{error}</p>
            <button type="button" onClick={() => void reload()} className="mt-2 text-sm font-semibold text-accent">
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20" role="status" aria-label="Loading rewards">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-edge bg-surface-card p-6">
              <p className="text-sm font-medium text-content-muted">My Points</p>
              <p className="mt-2 text-4xl font-bold">{me?.points ?? 0}</p>
            </section>

            <section className="rounded-2xl border border-edge bg-surface-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Trophy className="h-5 w-5 text-accent" /> Leaderboard
              </h2>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-content-muted">No points have been earned yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[24rem] text-left text-sm">
                    <thead className="text-content-muted">
                      <tr>
                        <th className="px-3 py-2">Rank</th>
                        <th className="px-3 py-2">Traveler</th>
                        <th className="px-3 py-2 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(row => (
                        <tr
                          key={row.user_id}
                          className={row.user_id === userId ? 'bg-accent/10 font-semibold' : ''}
                          aria-current={row.user_id === userId ? 'true' : undefined}
                        >
                          <td className="border-t border-edge px-3 py-3">#{row.rank}</td>
                          <td className="border-t border-edge px-3 py-3">
                            {row.username}{row.user_id === userId ? ' (you)' : ''}
                          </td>
                          <td className="border-t border-edge px-3 py-3 text-right">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Award className="h-5 w-5 text-accent" /> Reward Catalog
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {catalog?.rewards.map(reward => {
                  const canRedeem = (me?.points ?? 0) >= reward.points_required
                  return (
                    <article key={reward.id} className="rounded-2xl border border-edge bg-surface-card p-5">
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="mt-1 text-sm text-content-muted">{reward.points_required} points</p>
                      <button
                        type="button"
                        disabled={!canRedeem || redeemingId !== null}
                        onClick={() => void redeem(reward.id)}
                        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {redeemingId === reward.id ? 'Redeeming…' : canRedeem ? 'Redeem' : 'Not enough points'}
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>

      {coupon && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-coupon-title"
            className="w-full max-w-md rounded-2xl border border-edge bg-surface-card p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="reward-coupon-title" className="text-xl font-bold">Reward redeemed</h2>
                <p className="mt-1 text-sm text-content-muted">{coupon.rewardName}</p>
              </div>
              <button type="button" onClick={closeCoupon} aria-label="Close coupon" className="rounded-lg p-2 text-content-muted hover:bg-surface-elevated">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-5 text-sm text-content-muted">Your coupon code</p>
            <p className="mt-1 rounded-lg border border-edge bg-surface-elevated p-4 text-center font-mono text-xl font-bold tracking-widest">
              {coupon.couponCode}
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
