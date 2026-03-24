export type BeneficiaryCategory = {
  id: number
  name: string
  color: string
}

export type BeneficiaryCreator = {
  id: number
  name: string
}

export type BeneficiaryStatus = "draft" | "pending_review" | "returned" | "approved"

export type BeneficiaryListItem = {
  id: number
  beneficiaryNumber: string
  name: string | null
  nationalId: string
  gender: "male" | "female"
  dateOfBirth: string | null
  age: number | null
  phone: string | null
  categoryId: number | null
  status: BeneficiaryStatus
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
  notes: string
}

export type IncomeSources = Record<string, IncomeItem>

export type ObligationItem = {
  monthly: number
  notes: string
}

export type FinancialObligations = Record<string, ObligationItem>

// --- Dependent ---

export type DependentReligiousItem = {
  done: boolean
  visitDate?: string
  updateDate?: string
  nextUpdate?: string
}

export type DependentReligious = {
  hajj?: DependentReligiousItem
  umrah?: DependentReligiousItem
  prophetMosque?: DependentReligiousItem
}

export type Dependent = {
  id: number
  beneficiaryId: number
  name: string | null
  nationalId: string | null
  gender: "male" | "female"
  dateOfBirth: string | null
  age: number | null
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
  religious: DependentReligious | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Document = {
  id: number
  beneficiaryId: number
  type: string
  name: string
  url: string
  notes: string | null
  createdAt: string
}

export type DocumentType = {
  key: string
  label: string
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
  age: number | null
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
  status: BeneficiaryStatus
  returnNote: string | null
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
  name?: string | null
  gender?: "male" | "female" | null
  dateOfBirth?: string | null
  maritalStatus?: string | null
  phone?: string | null
  otherPhone?: string | null
  familyCount?: number | null
  iban?: string | null
  bank?: string | null
  residenceArea?: string | null
  residenceAreaOther?: string | null
  buildingOwnership?: string | null
  buildingType?: string | null
  buildingTypeOther?: string | null
  buildingCondition?: string | null
  buildingCapacity?: string | null
  husbandReligious?: ReligiousVisits
  wifeReligious?: ReligiousVisits
  furnitureAppliances?: FurnitureAppliances
  incomeSources?: IncomeSources
  financialObligations?: FinancialObligations
  attributes?: string | null
  enrollment?: string | null
  visitDate?: string | null
  updateDone?: string | null
  nextUpdate?: string | null
  specialDate?: string | null
  healthStatus?: string | null
  origin?: string | null
  familySkillsTalents?: string | null
  researcherNotes?: string | null
  notes?: string | null
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
  religious?: DependentReligious
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

// --- V4: Review Workflow ---

export type SubmitReviewResponse = {
  success: true
  message: string
  beneficiary: Beneficiary
}

export type SubmitReviewErrorDetails = {
  beneficiaryMissing: { fieldName: string; fieldLabel: string }[]
  dependentMissing: {
    dependentId: number
    dependentName: string
    fieldName: string
    fieldLabel: string
  }[]
}

export type ReturnBeneficiaryResponse = {
  success: true
  message: string
  beneficiary: Beneficiary
}

export type ReviewQueueResponse = {
  success: true
  beneficiaries: Beneficiary[]
  pagination: Pagination
}

// --- V4: Progress ---

export type ProgressResponse = {
  success: true
  progress: number
  totalRequired: number
  filledCount: number
  pendingFields: { fieldName: string; fieldLabel: string }[]
}

// --- V4: Document Types ---

export type DocumentTypesResponse = {
  success: true
  types: DocumentType[]
}
