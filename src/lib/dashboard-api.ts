import { apiClient } from "@/lib/api-client"
import type {
  StatsResponse,
  DailyStatsResponse,
  ActivityResponse,
  RecentProfilesResponse,
} from "@/types/dashboard"

export async function getStats() {
  return apiClient<StatsResponse>("/dashboard/stats")
}

export async function getDailyStats(days: 7 | 30 | 90 = 7) {
  return apiClient<DailyStatsResponse>(
    `/dashboard/daily-stats?days=${days}`
  )
}

export async function getActivity() {
  return apiClient<ActivityResponse>("/dashboard/activity")
}

export async function getRecentProfiles() {
  return apiClient<RecentProfilesResponse>("/dashboard/recent-profiles")
}
