export type BeneficiaryCategory = {
  id: number
  name: string
  color: string
}

export type BeneficiaryCreator = {
  id: number
  name: string
}

export type BeneficiaryListItem = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  gender: "male" | "female"
  dateOfBirth: string | null
  phone: string | null
  categoryId: number | null
  createdAt: string
  createdBy: BeneficiaryCreator
  category: BeneficiaryCategory | null
}

// --- JSON field types ---

export type ReligiousItem = {
  done: boolean
  visitDate?: string
  updateDate?: string
  nextUpdate?: string
}

export type ReligiousVisits = {
  hajj?: ReligiousItem
  umrah?: ReligiousItem
  prophetMosque?: ReligiousItem
}

export type ApplianceCondition = {
  good: number
  unavailable: number
  needsRepair: number
  needsReplacement: number
  notes: string
}

export type FurnitureAppliances = Record<string, ApplianceCondition>

export type IncomeItem = {
  monthly: number
  yearly: number
  notes: string
}

export type IncomeSources = Record<string, IncomeItem>

export type ObligationItem = {
  monthly: number
  yearly: number
  notes: string
}

export type FinancialObligations = Record<string, ObligationItem>

// --- Dependent ---

export type Dependent = {
  id: number
  beneficiaryId: number
  name: string | null
  nationalId: string | null
  gender: "male" | "female"
  dateOfBirth: string | null
  relationship: "son" | "daughter" | "other" | null
  relationshipOther: string | null
  dependentMaritalStatus: string | null
  schoolName: string | null
  schoolGrade: string | null
  schoolType: "public" | "private" | "other" | null
  schoolTypeOther: string | null
  academicGrade: string | null
  weaknessSubjects: string | null
  educationStatus:
    | "enrolled"
    | "graduated"
    | "dropped_out"
    | "not_enrolled"
    | null
  healthStatus: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Document = {
  id: number
  beneficiaryId: number
  name: string
  url: string
  createdAt: string
}

// --- Beneficiary ---

export type Beneficiary = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  categoryId: number | null
  gender: "male" | "female"
  dateOfBirth: string | null
  maritalStatus:
    | "married"
    | "single"
    | "divorced"
    | "widowed"
    | "abandoned"
    | null
  phone: string | null
  otherPhone: string | null
  familyCount: number | null
  dependentsCount: number | null
  iban: string | null
  bank: string | null
  residenceArea: string | null
  residenceAreaOther: string | null
  buildingOwnership: string | null
  buildingType: string | null
  buildingTypeOther: string | null
  buildingCondition: string | null
  buildingCapacity: string | null
  husbandReligious: ReligiousVisits | null
  wifeReligious: ReligiousVisits | null
  furnitureAppliances: FurnitureAppliances | null
  incomeSources: IncomeSources | null
  financialObligations: FinancialObligations | null
  attributes: string | null
  enrollment: string | null
  visitDate: string | null
  updateDone: string | null
  nextUpdate: string | null
  specialDate: string | null
  healthStatus: string | null
  origin: string | null
  familySkillsTalents: string | null
  researcherNotes: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  createdBy: BeneficiaryCreator
  category: BeneficiaryCategory | null
  dependents: Dependent[]
  documents: Document[]
  disbursements: BeneficiaryDisbursement[]
}

export type BeneficiaryDisbursement = {
  id: number
  programId: number
  disbursedById: number
  receiverName: string | null
  acknowledgmentFile: string | null
  disbursedAt: string
  notes: string | null
  program: { id: number; name: string }
  disbursedBy: { id: number; name: string }
}

// --- Requests ---

export type CreateBeneficiaryRequest = {
  nationalId: string
  name?: string
  gender?: "male" | "female"
  dateOfBirth?: string
  maritalStatus?: string
  phone?: string
  otherPhone?: string
  familyCount?: number
  iban?: string
  bank?: string
  residenceArea?: string
  residenceAreaOther?: string
  buildingOwnership?: string
  buildingType?: string
  buildingTypeOther?: string
  buildingCondition?: string
  buildingCapacity?: string
  husbandReligious?: ReligiousVisits
  wifeReligious?: ReligiousVisits
  furnitureAppliances?: FurnitureAppliances
  incomeSources?: IncomeSources
  financialObligations?: FinancialObligations
  attributes?: string
  enrollment?: string
  visitDate?: string
  updateDone?: string
  nextUpdate?: string
  specialDate?: string
  healthStatus?: string
  origin?: string
  familySkillsTalents?: string
  researcherNotes?: string
  notes?: string
}

export type UpdateBeneficiaryRequest = Partial<CreateBeneficiaryRequest>

export type AssignCategoryRequest = {
  categoryId: number
  note: string
}

export type AssignCategoryResponse = {
  success: true
  message: string
  beneficiary: {
    id: number
    beneficiaryNumber: string
    categoryId: number
    category: BeneficiaryCategory
  }
}

export type CategoryHistoryEntry = {
  id: number
  categoryId: number
  previousCategoryId: number | null
  note: string
  createdAt: string
  category: BeneficiaryCategory
  previousCategory: BeneficiaryCategory | null
  assignedBy: { id: number; name: string }
}

export type CategoryHistoryResponse = {
  success: true
  history: CategoryHistoryEntry[]
}

export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type BeneficiariesListResponse = {
  success: true
  beneficiaries: BeneficiaryListItem[]
  pagination: Pagination
}

export type BeneficiaryDetailResponse = {
  success: true
  beneficiary: Beneficiary
}

export type BeneficiaryMutationResponse = {
  success: true
  beneficiary: Beneficiary
}

export type DeleteResponse = {
  success: true
  message: string
}

export type CreateDependentRequest = {
  name?: string
  nationalId?: string
  gender?: "male" | "female"
  dateOfBirth?: string
  relationship?: "son" | "daughter" | "other"
  relationshipOther?: string
  dependentMaritalStatus?: string
  schoolName?: string
  schoolGrade?: string
  schoolType?: "public" | "private" | "other"
  schoolTypeOther?: string
  academicGrade?: string
  weaknessSubjects?: string
  educationStatus?: "enrolled" | "graduated" | "dropped_out" | "not_enrolled"
  healthStatus?: string
  notes?: string
}

export type UpdateDependentRequest = Partial<CreateDependentRequest>

export type DependentsListResponse = {
  success: true
  dependents: Dependent[]
}

export type DependentMutationResponse = {
  success: true
  dependent: Dependent
}
