export type OrderPaymentType = 'credit_card' | 'transfer' | 'ask_sell';
export type OrderPaymentPlan = 'full' | 'prepayment';
export type OrderKind = 'order' | 'ask_sell';
export type OrderStatus = 'new' | 'completed' | 'cancelled';
export type RefundType = 'full' | 'partial' | null;

export type Order = {
  id: string;
  /** Kayıtlı üye siparişinde atanır */
  userId?: string;
  orderNo: string;
  fullName: string;
  phone: string;
  email: string;
  activityId: string;
  tourName: string;
  departurePlace: string;
  date: string;
  peopleCount: number;
  /** Normal sipariş veya sor-sat talebi */
  orderKind?: OrderKind;
  paymentType: OrderPaymentType;
  /** Tahsilat planı: tam ödeme veya ön ödeme */
  paymentPlan?: OrderPaymentPlan;
  transferPaid?: boolean;
  /** Liste fiyatına göre toplam (indirim/ön ödeme öncesi) */
  grossTotalAmount?: number;
  /** Sipariş anındaki ön ödeme oranı (%) */
  prepaymentPercent?: number;
  totalAmount: number;
  unitPrice?: number;
  status: OrderStatus;
  // Reservation personal info snapshot
  countryCode?: string;
  passengers?: {
    firstName: string;
    lastName: string;
    fullName: string;
    birthDate: string;
    tcNo?: string;
    isForeignCitizen: boolean;
    gender: 'female' | 'male';
  }[];
  // Activity snapshot details
  location?: string;
  tripInfo?: string;
  invoicePdfUrl?: string;
  /** PDF yolcu bileti üretildiğinde (kart veya havale onayı sonrası) */
  ticketIssuedAt?: string;
  cancelReason?: string;
  refundType?: RefundType;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
};

