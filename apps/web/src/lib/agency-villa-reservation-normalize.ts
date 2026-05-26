import type {
  AgencyVillaReservation,
  AgencyVillaReservationStatus,
} from '@/types/admin-agency-villa-reservation';

const STATUSES: AgencyVillaReservationStatus[] = ['active', 'passive', 'cancelled'];

function parseOptionalNumber(v: unknown): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseOptionalInt(v: unknown): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseStatus(v: unknown): AgencyVillaReservationStatus {
  const s = String(v ?? 'active').trim() as AgencyVillaReservationStatus;
  return STATUSES.includes(s) ? s : 'active';
}

function parseDate(v: unknown): string {
  return String(v ?? '').trim();
}

export function validateAgencyReservationDates(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) return 'Giriş ve çıkış tarihi zorunludur.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return 'Tarih formatı YYYY-MM-DD olmalıdır.';
  }
  if (checkOut <= checkIn) return 'Çıkış tarihi girişten sonra olmalıdır.';
  return null;
}

export function normalizeAgencyVillaReservationBody(
  body: Record<string, unknown>,
  existing?: AgencyVillaReservation,
): { data: Omit<AgencyVillaReservation, 'id' | 'createdAt' | 'updatedAt'>; error: string | null } {
  const villaId =
    body.villaId !== undefined ? String(body.villaId).trim() : (existing?.villaId ?? '');
  const checkIn = body.checkIn !== undefined ? parseDate(body.checkIn) : (existing?.checkIn ?? '');
  const checkOut = body.checkOut !== undefined ? parseDate(body.checkOut) : (existing?.checkOut ?? '');

  if (!villaId) return { data: null as never, error: 'Villa seçimi zorunludur.' };
  const dateErr = validateAgencyReservationDates(checkIn, checkOut);
  if (dateErr) return { data: null as never, error: dateErr };

  const data = {
    villaId,
    checkIn,
    checkOut,
    agencyName:
      body.agencyName !== undefined ? String(body.agencyName).trim() : (existing?.agencyName ?? ''),
    fullName: body.fullName !== undefined ? String(body.fullName).trim() : (existing?.fullName ?? ''),
    guestCount:
      body.guestCount !== undefined ? parseOptionalInt(body.guestCount) : (existing?.guestCount ?? 0),
    phone: body.phone !== undefined ? String(body.phone).trim() : (existing?.phone ?? ''),
    tcKimlikNo:
      body.tcKimlikNo !== undefined ? String(body.tcKimlikNo).trim() : (existing?.tcKimlikNo ?? ''),
    email: body.email !== undefined ? String(body.email).trim() : (existing?.email ?? ''),
    advancePayment:
      body.advancePayment !== undefined
        ? parseOptionalNumber(body.advancePayment)
        : (existing?.advancePayment ?? 0),
    cleaningFee:
      body.cleaningFee !== undefined ? parseOptionalNumber(body.cleaningFee) : (existing?.cleaningFee ?? 0),
    totalAmount:
      body.totalAmount !== undefined ? parseOptionalNumber(body.totalAmount) : (existing?.totalAmount ?? 0),
    heatingFee:
      body.heatingFee !== undefined ? parseOptionalNumber(body.heatingFee) : (existing?.heatingFee ?? 0),
    damageDeposit:
      body.damageDeposit !== undefined
        ? parseOptionalNumber(body.damageDeposit)
        : (existing?.damageDeposit ?? 0),
    note: body.note !== undefined ? String(body.note).trim() : (existing?.note ?? ''),
    status: body.status !== undefined ? parseStatus(body.status) : (existing?.status ?? 'active'),
  };

  return { data, error: null };
}
