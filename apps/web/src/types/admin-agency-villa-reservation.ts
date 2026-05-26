export type AgencyVillaReservationStatus = 'active' | 'passive' | 'cancelled';

export type AgencyVillaReservation = {
  id: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  agencyName: string;
  fullName: string;
  guestCount: number;
  phone: string;
  tcKimlikNo: string;
  email: string;
  advancePayment: number;
  cleaningFee: number;
  totalAmount: number;
  heatingFee: number;
  damageDeposit: number;
  note: string;
  status: AgencyVillaReservationStatus;
  createdAt: string;
  updatedAt: string;
};
