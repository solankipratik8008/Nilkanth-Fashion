import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNotification } from './notificationService';

export interface AdminSuggestions {
  fabrics: string[];
  colors: string[];
  message: string;
  suggestedAt: string;
}

export async function suggestChangesToRequest(
  requestId: string,
  userId: string,
  userName: string,
  category: string,
  suggestions: AdminSuggestions
): Promise<void> {
  await updateDoc(doc(db, 'customDesignRequests', requestId), {
    status: 'awaiting-confirmation',
    adminSuggestions: suggestions,
    updatedAt: new Date(),
  });
  await sendNotification(userId, {
    id: `${requestId}-suggestion-${Date.now()}`,
    type: 'design_request',
    status: 'awaiting-confirmation',
    message: `Our team reviewed your custom design (${category.replace(/-/g, ' ')}) and has suggestions: ${suggestions.message}`,
    requestId,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function approveDesignRequest(
  requestId: string,
  userId: string,
  category: string
): Promise<void> {
  await updateDoc(doc(db, 'customDesignRequests', requestId), {
    status: 'approved',
    updatedAt: new Date(),
  });
  await sendNotification(userId, {
    id: `${requestId}-approved-${Date.now()}`,
    type: 'design_request',
    status: 'approved',
    message: `Your custom design request (${category.replace(/-/g, ' ')}) has been approved! You can now proceed to place your order.`,
    requestId,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function rejectDesignRequest(
  requestId: string,
  userId: string,
  category: string,
  adminNote: string
): Promise<void> {
  await updateDoc(doc(db, 'customDesignRequests', requestId), {
    status: 'rejected',
    adminNote,
    updatedAt: new Date(),
  });
  await sendNotification(userId, {
    id: `${requestId}-rejected-${Date.now()}`,
    type: 'design_request',
    status: 'rejected',
    message: adminNote
      ? `Your design request was not approved. Reason: ${adminNote}`
      : `Your design request (${category.replace(/-/g, ' ')}) was not approved at this time.`,
    requestId,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function respondToDesignRequestSuggestion(
  requestId: string,
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
  await updateDoc(doc(db, 'customDesignRequests', requestId), {
    status: newStatus,
    userResponse,
    updatedAt: new Date(),
  });
  return newStatus;
}
