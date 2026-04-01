import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test Firestore connection on boot
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Update user presence
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            status: 'online',
            lastSeen: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle presence on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        // Note: setDoc in beforeunload is not guaranteed to complete.
        // For a robust solution, Firebase Realtime Database presence is recommended.
        setDoc(userRef, {
          status: 'offline',
          lastSeen: serverTimestamp(),
        }, { merge: true }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {user ? <ChatLayout user={user} /> : <Login />}
    </ErrorBoundary>
  );
}
