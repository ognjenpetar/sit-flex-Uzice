export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Na čekanju',
  confirmed: 'Potvrđena',
  assigned: 'Dodeljena',
  in_progress: 'U toku',
  completed: 'Završena',
  cancelled: 'Otkazana',
  no_show: 'Nije došao',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-100 text-red-800',
}

export const PASSENGER_CATEGORY_LABELS: Record<string, string> = {
  standard: 'Standardni',
  elderly: 'Starija osoba',
  youth: 'Mladi',
  caregiver: 'Negovatelj',
  low_income: 'Niska primanja',
}

export const TRIP_PURPOSE_LABELS: Record<string, string> = {
  healthcare: 'Zdravstvena usluga',
  education: 'Obrazovanje',
  work: 'Posao',
  shopping: 'Kupovina',
  admin_services: 'Administrativne usluge',
  social: 'Socijalne aktivnosti',
  other: 'Ostalo',
}

export const SETTLEMENT_LABELS: Record<string, string> = {
  kacer: 'Kaćer',
  tara: 'Tara',
  uzice_center: 'Užice centar',
  other: 'Ostalo',
}

export const OVERRIDE_REASON_LABELS: Record<string, string> = {
  passenger_request: 'Zahtev putnika',
  operational_necessity: 'Operativna nužnost',
  vehicle_substitution: 'Zamena vozila',
  tariff_correction: 'Korekcija tarife',
  accessibility_requirement: 'Pristupačnost',
  other: 'Ostalo',
}

export const TARIFF_CODES = ['T1', 'T2', 'T3'] as const
export type TariffCode = typeof TARIFF_CODES[number]

export const OVERDUE_THRESHOLD_MIN = 25
export const BOOKING_CUTOFF_HOUR = 15
