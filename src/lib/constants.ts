import type { BeneficiaryStatus } from "@/types/beneficiaries"

export const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
}

export const STATUS_LABELS: Record<BeneficiaryStatus, string> = {
  draft: "مسودة",
  pending_review: "قيد المراجعة",
  returned: "مُعاد",
  approved: "معتمد",
}

export const STATUS_COLORS: Record<BeneficiaryStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pending_review:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  returned:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}
