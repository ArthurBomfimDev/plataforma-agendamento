export type BusinessImageSlot = 'logo' | 'cover'

export type AffectedAppointmentsParams = {
  startsAt: string
  endsAt: string
  professionalId: string | null
}

/** Fração enviada, de 0 a 1. */
export type UploadProgress = (fraction: number) => void
