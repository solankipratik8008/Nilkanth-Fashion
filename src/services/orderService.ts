import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const PRE_PRODUCTION_STATUSES = [
  'pending-review',
  'awaiting-confirmation',
  'user-confirmed',
  'waiting-for-fabric',
];

export function canCancelOrder(status: string): boolean {
  return PRE_PRODUCTION_STATUSES.includes(status);
}

export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'cancelled',
    cancelledByUser: true,
    cancelReason: reason || '',
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date(),
  });
}

export async function respondToAdminSuggestion(
  orderId: string,
  type: 'accept-suggested' | 'provide-own' | 'cancel',
  extras?: { fabric: string; color: string }
): Promise<string> {
  const statusMap: Record<string, string> = {
    'accept-suggested': 'user-confirmed',
    'provide-own': 'waiting-for-fabric',
    cancel: 'cancelled',
  };
  const newStatus = statusMap[type];
  const userResponse: Record<string, any> = { type, respondedAt: new Date().toISOString() };
  if (type === 'accept-suggested') {
    userResponse.selectedFabric = extras?.fabric || '';
    userResponse.selectedColor = extras?.color || '';
  }
  await updateDoc(doc(db, 'orders', orderId), {
    status: newStatus,
    userResponse,
    updatedAt: new Date(),
  });
  return newStatus;
}
