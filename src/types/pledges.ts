export type PledgeBeneficiary = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  phone?: string | null
}

export type LookupResponse = {
  success: true
  found: boolean
  alreadySigned?: boolean
  message?: string
  beneficiary?: PledgeBeneficiary
  pledge?: {
    id: number
    signedAt: string
  }
  pledgeText?: string
}

export type Pledge = {
  id: number
  beneficiaryId: number
  processedById: number
  pledgeText: string
  pdfFile: string | null
  signedAt: string
  createdAt: string
  updatedAt: string
}

export type CreatePledgeResponse = {
  success: true
  pledge: Pledge
}

export type PledgeListItem = {
  id: number
  beneficiaryId: number
  processedById: number
  pledgeText: string
  pdfFile: string | null
  signedAt: string
  beneficiary: {
    id: number
    beneficiaryNumber: string
    name: string | null
    nationalId: string
  }
  processedBy: {
    id: number
    name: string
  }
}

export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PledgesListResponse = {
  success: true
  pledges: PledgeListItem[]
  pagination: Pagination
}
