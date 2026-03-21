export type ActiveProgram = {
  id: number
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  categories: { id: number; name: string; color: string }[]
}

export type EligibleBeneficiary = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  phone: string | null
  category: { id: number; name: string; color: string } | null
  dependents?: { id: number; name: string | null; nationalId: string | null }[]
}

export type EligibilityProgram = {
  id: number
  name: string
  description: string | null
}

export type EligibilityResponse = {
  success: true
  eligible: boolean
  reason?: string
  beneficiary: EligibleBeneficiary
  program?: EligibilityProgram
}

export type CreateDisbursementRequest = {
  beneficiaryId: number
  programId: number
  signature?: string
  receiverName?: string | null
  notes?: string | null
}

export type DisbursementBeneficiary = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  category: { id: number; name: string; color: string } | null
}

export type DisbursementListItem = {
  id: number
  beneficiaryId: number
  programId: number
  disbursedById: number
  receiverName: string | null
  acknowledgmentFile: string | null
  disbursedAt: string
  notes: string | null
  createdAt: string
  updatedAt: string
  beneficiary: DisbursementBeneficiary
  program: { id: number; name: string }
  disbursedBy: { id: number; name: string; email?: string }
}

export type Disbursement = DisbursementListItem

export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ActiveProgramsResponse = {
  success: true
  programs: ActiveProgram[]
}

export type CreateDisbursementResponse = {
  success: true
  disbursement: Disbursement
}

export type DisbursementsListResponse = {
  success: true
  disbursements: DisbursementListItem[]
  pagination: Pagination
}

export type DisbursementDetailResponse = {
  success: true
  disbursement: Disbursement
}

export type BeneficiaryDisbursementsResponse = {
  success: true
  disbursements: {
    id: number
    programId: number
    disbursedAt: string
    notes: string | null
    program: { id: number; name: string }
    disbursedBy: { id: number; name: string }
  }[]
}

export type ProgramRecipientsResponse = {
  success: true
  program: { id: number; name: string }
  recipients: DisbursementListItem[]
  pagination: Pagination
}
