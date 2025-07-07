import { db } from "@/firebase/firebase";
import { Channel } from "@/utils/interfaces";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const getChannelData = async (
  userId: string
): Promise<Channel | null> => {
  try {
    const channelRef = doc(db, "channels", userId);
    const channelSnapshot = await getDoc(channelRef);

    if (!channelSnapshot.exists()) {
      return null
    }

    return channelSnapshot.data() as Channel;
  } catch (error) {
    console.error("Error fetching channel data: ", error);
    throw error;
  }
};

export const createOrUpdateChannel = async (
  uid: string,
  displayName: string,
  bannerURL: string = "",
  profilePicURL: string
) => {
  try {
    const channelRef = doc(db, "channels", uid);
    await setDoc(channelRef, {
      displayName,
      bannerURL,
      profilePicURL,
    });

    console.log("Channel created/updated:", {
      uid,
      displayName,
      bannerURL,
      profilePicURL,
    });
  } catch (error) {
    console.error("Firestore error while creating/updating channel:", error);
    throw error;
  }
};
