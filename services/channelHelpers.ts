import { db } from "@/firebase/firebase";
import { Channel } from "@/utils/interfaces";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getCourseData, getUnitForCourse } from "./courseUnitData";

export const getChannelData = async (
  userId: string
): Promise<Channel | null> => {
  try {
    const channelRef = doc(db, "channels", userId);
    const channelSnapshot = await getDoc(channelRef);

    if (!channelSnapshot.exists()) {
      return null;
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

export async function getChannelFromCourse(
  courseId: string
): Promise<Channel | null> {
  try {
    const courseDoc = await getCourseData(courseId);
    const id = courseDoc?.creator;
    const channelSnap = await getChannelData(id);
    if (channelSnap) {
      return channelSnap as Channel;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching channel from course: ", error);
    return null;
  }
}

export async function getCourseUnitNamesFromId(
  courseId: string,
  unit_id: string
) {
  try {
    const courseDoc = await getCourseData(courseId);
    const courseName = courseDoc?.name;
    const id = courseDoc?.key;
    let unitName = "";
    if (unit_id) {
      const unitDoc = await getUnitForCourse(courseId, unit_id);
      unitName = unitDoc?.name;
    }
    return { courseName, unitName, id };
  } catch (error) {
    console.error("Error fetching course and unit names: ", error);
    return null;
  }
}
