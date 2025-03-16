import { db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export const getChannelData = async (userId: string) => {
  try {
    const channelRef = doc(db, "channels", userId);
    const channelSnapshot = await getDoc(channelRef);
    return channelSnapshot;
  } catch (error) {
    console.error("Error fetching channel data: ", error);
    throw error;
  }
};

export const getCourseData = async(courseId: string) => {
    try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnapshot = await getDoc(courseRef);
        return courseSnapshot
    } catch (error) {
        console.error("Error fetching course data: ", error);
        throw error;
      }
}

export async function getUserCourseList(user: string) {
    try {
      const userDocRef = doc(db, 'channels', user);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return Array.isArray(data.courses) ? data.courses : [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

export async function getUserChannelPic(user: string) {
  try {
    const userDocRef = doc(db, 'channels', user);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return data.profilePicURL;
    } else {
      return "";
    }
  } catch (error) {
    console.error('Error fetching photo:', error);
    throw new Error('Failed to fetch photo');
  }
}
