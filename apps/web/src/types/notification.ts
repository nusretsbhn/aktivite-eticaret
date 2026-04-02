export type AdminNotificationType = 'new_order' | 'cancel_request';

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  refId: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
};

export type UserNotificationType = 'order_created' | 'cancel_approved' | 'cancel_rejected';

export type UserNotification = {
  id: string;
  userId: string;
  type: UserNotificationType;
  refId: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  readAt: string | null;
};
