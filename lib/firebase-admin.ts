import 'server-only';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    // Only init if we actually have credentials, otherwise we might rely on default ADC
    if (serviceAccount.projectId && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      initializeApp();
    }
  } catch (error: unknown) {
    const err = error as { stack?: string };
    console.error('Firebase Admin init error:', err.stack);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
