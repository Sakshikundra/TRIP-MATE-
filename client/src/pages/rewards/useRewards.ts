import { useCallback, useEffect, useState } from 'react'
import type {
  RewardsCatalogResponse,
  RewardsLeaderboardResponse,
  RewardsMeResponse,
  RewardRedeemResponse,
} from '@trek/shared'
import { rewardsApi } from '../../api/client'
import { useToast } from '../../components/shared/Toast'
import { translateApiError, useTranslation } from '../../i18n'
import { useAuthStore } from '../../store/authStore'

export function useRewards() {
  const { t } = useTranslation()
  const toast = useToast()
  const userId = useAuthStore(s => s.user?.id)
  const [me, setMe] = useState<RewardsMeResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<RewardsLeaderboardResponse['leaderboard']>([])
  const [catalog, setCatalog] = useState<RewardsCatalogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [coupon, setCoupon] = useState<RewardRedeemResponse | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [mine, scores, rewards] = await Promise.all([
        rewardsApi.me(),
        rewardsApi.leaderboard(),
        rewardsApi.catalog(),
      ])
      setMe(mine)
      setLeaderboard(scores.leaderboard)
      setCatalog(rewards)
    } catch (cause) {
      setError(translateApiError(t, cause, 'common.error'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const redeem = useCallback(async (rewardId: number) => {
    setRedeemingId(rewardId)
    try {
      const result = await rewardsApi.redeem(rewardId)
      setCoupon(result)
      try {
        const [mine, scores, rewards] = await Promise.all([
          rewardsApi.me(),
          rewardsApi.leaderboard(),
          rewardsApi.catalog(),
        ])
        setMe(mine)
        setLeaderboard(scores.leaderboard)
        setCatalog(rewards)
      } catch (cause) {
        toast.error(translateApiError(t, cause, 'common.error'))
      }
    } catch (cause) {
      toast.error(translateApiError(t, cause, 'common.error'))
    } finally {
      setRedeemingId(null)
    }
  }, [t, toast])

  return {
    me,
    leaderboard,
    catalog,
    isLoading,
    error,
    userId,
    redeemingId,
    coupon,
    closeCoupon: () => setCoupon(null),
    redeem,
    reload: load,
  }
}
