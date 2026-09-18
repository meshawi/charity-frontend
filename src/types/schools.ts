export type School = {
  id: number
  name: string
  /** Dependents whose school is this one */
  dependentsCount: number
}

/** A school name typed on dependents that is not in the managed list */
export type UnlistedSchool = {
  name: string
  dependentsCount: number
}

export type SchoolsListResponse = {
  success: true
  schools: School[]
  unlisted: UnlistedSchool[]
}

/**
 * What to do with the dependents of a school being deleted:
 * move them to another school, or leave the name on their files.
 */
export type DeleteSchoolRequest =
  | { mode: "transfer"; transferToId: number }
  | { mode: "keep" }

export type SchoolMutationResponse = {
  success: true
  message: string
}

export type ImportSchoolsResponse = {
  success: true
  message: string
  imported: number
}
