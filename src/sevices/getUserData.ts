import { db } from "@/firebase/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

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

export const getCourseData = async (courseId: string) => {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);
    return courseSnapshot;
  } catch (error) {
    console.error("Error fetching course data: ", error);
    throw error;
  }
};

export async function getUserCourseList(user: string) {
  try {
    const userDocRef = doc(db, "channels", user);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return Array.isArray(data.courses) ? data.courses : [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new Error("Failed to fetch courses");
  }
}

export async function getUserChannelPic(user: string) {
  try {
    const userDocRef = doc(db, "channels", user);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return data.profilePicURL;
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error fetching photo:", error);
    throw new Error("Failed to fetch photo");
  }
}

export async function getUnits(courseId: string) {
  try {
    const unitsRef = collection(db, "courses", courseId, "units");
    const unitDocs = await getDocs(unitsRef);
    const unitIds = unitDocs.docs.map((doc) => doc.id);
    return unitIds;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
}

export async function getUnit(courseId: string, unitId: string) {
  try {
    const unitRef = doc(collection(db, "courses", courseId, "units"), unitId);
    const unitSnap = await getDoc(unitRef);
    return unitSnap;
  } catch (error) {
    console.error("Failed to fetch unit:", error);
    throw error;
  }
}
