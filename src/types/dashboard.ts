export type DashboardStats = {
  users: { total: number }
  profiles: {
    total: number
    newThisMonth: number
    byCategory: {
      categoryId: number
      name: string
      color: string
      count: number
    }[]
  }
  disbursements: {
    total: number
    thisMonth: number
    today: number
  }
}

export type DailyStatPoint = {
  date: string
  dateAr: string
  beneficiaries: number
  disbursements: number
}

export type Activity = {
  id: number
  user: string
  action: "CREATE" | "UPDATE" | "DELETE"
  entityType: "BENEFICIARY" | "DEPENDENT" | "DISBURSEMENT"
  entityId: number
  time: string
}

export type RecentProfile = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  category: { id: number; name: string; color: string } | null
  createdBy: { id: number; name: string }
  createdAt: string
}

export type StatsResponse = {
  success: true
  stats: DashboardStats
}

export type DailyStatsResponse = {
  success: true
  data: DailyStatPoint[]
  defaultChart?: string
}

export type ActivityResponse = {
  success: true
  activities: Activity[]
}

export type RecentProfilesResponse = {
  success: true
  profiles: RecentProfile[]
}
