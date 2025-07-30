import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";

export function useUserChannel(channelId: string | null) {
  const [hasChannel, setHasChannel] = useState<boolean | null>(null);
  const [channelLoading, setChannellLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setHasChannel(null);
      setChannellLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setHasChannel(false);
        setChannellLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "channels", user.uid);
        const docSnap = await getDoc(docRef);

        setHasChannel(docSnap.exists());
      } catch (err) {
        console.error("Error checking channel:", err);
        setHasChannel(false);
      } finally {
        setChannellLoading(false);
      }
    });

    return () => unsubscribe();
  }, [channelId]);

  return { hasChannel, channelLoading };
}
