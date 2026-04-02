export type CancellationRequestStatus = 'pending' | 'approved' | 'rejected';

export type CancellationRequest = {
  id: string;
  orderId: string;
  orderNo: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: CancellationRequestStatus;
  createdAt: string;
  updatedAt: string;
};
