import 'server-only';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  try {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    if (serviceAccount.projectId && serviceAccount.privateKey) {
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      return initializeApp();
    }
  } catch (error: unknown) {
    const err = error as { stack?: string };
    console.error('Firebase Admin init error:', err.stack);
    return initializeApp();
  }
}

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop: keyof ReturnType<typeof getFirestore>) {
    const app = getAdminApp();
    const db = getFirestore(app);
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop: keyof ReturnType<typeof getAuth>) {
    const app = getAdminApp();
    const auth = getAuth(app);
    const value = auth[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  },
});
