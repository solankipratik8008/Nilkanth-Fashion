import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AppNotification {
  id: string;
  type: 'design_request' | 'order_update' | 'general';
  status: string;
  message: string;
  read: boolean;
  createdAt: string;
  [key: string]: any;
}

export async function sendNotification(userId: string, notification: AppNotification): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    notifications: arrayUnion(notification),
  });
}
