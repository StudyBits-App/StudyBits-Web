import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from './authContext';
import { db } from '@/firebase/firebase';

export function useUserChannel() {
  const { user } = useAuth();
  const [hasChannel, setHasChannel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasChannel(false);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'channels', user.uid),
      snapshot => {
        setHasChannel(snapshot.exists());
        setLoading(false);
      },
      error => {
        console.error('Error checking user channel:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  return { hasChannel, loading };
}
