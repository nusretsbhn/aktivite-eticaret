export enum UserRole {
  customer = 'customer',
  staff = 'staff',
  admin = 'admin',
}

export enum ActivityCategory {
  boat_tour = 'boat_tour',
  parasailing = 'parasailing',
  jeep_safari = 'jeep_safari',
  diving = 'diving',
  other = 'other',
}

export enum ScheduleStatus {
  open = 'open',
  full = 'full',
  cancelled = 'cancelled',
  completed = 'completed',
}

export enum BookingStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  cancelled = 'cancelled',
  completed = 'completed',
  refunded = 'refunded',
}

export enum PaymentMethod {
  credit_card = 'credit_card',
  bank_transfer = 'bank_transfer',
}

export enum PaymentStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
  refunded = 'refunded',
}

export enum NotificationType {
  sms = 'sms',
  email = 'email',
}

export enum NotificationStatus {
  sent = 'sent',
  failed = 'failed',
  pending = 'pending',
}

export enum InvoiceStatus {
  draft = 'draft',
  sent = 'sent',
  cancelled = 'cancelled',
}

