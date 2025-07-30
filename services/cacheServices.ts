import { db } from "@/firebase/firebase";
import { Course, Unit } from "@/utils/interfaces";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export async function cacheCoursesAndUnits(uid: string) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("channel")) {
      localStorage.removeItem(key);
    }
  }

  try {
    const channelRef = doc(db, "channels", uid);
    const snapshot = await getDoc(channelRef);
    const data = snapshot.data();
    const courses = data?.courses;

    for (const courseEntry of courses || []) {
      const courseId =
        typeof courseEntry === "string" ? courseEntry : courseEntry?.id;
      if (!courseId) continue;

      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) continue;

      const courseData = courseSnap.data() as Course;
      localStorage.setItem(
        `channel-course-${courseId}`,
        JSON.stringify(courseData)
      );

      const unitsRef = collection(db, "courses", courseId, "units");
      const unitsSnap = await getDocs(unitsRef);

      unitsSnap.forEach((unitDoc) => {
        const unitData = unitDoc.data() as Unit;
        const unitKey = `channel-unit-${courseId}-${unitDoc.id}`;
        localStorage.setItem(unitKey, JSON.stringify(unitData));
      });
    }
  } catch (error) {
    console.error("Error caching courses and units:", error);
  }
}

export async function cacheSubscribedCourses(uid: string) {
  try {
    localStorage.removeItem("subscriptions");

    const reverseMap: Record<string, string> = {}; // { subscribedCourseId: baseCourseId }

    const userLearningRef = collection(db, "learning", uid, "courses");
    const snapshot = await getDocs(userLearningRef);

    snapshot.forEach((doc) => {
      const baseCourseId = doc.id;
      const data = doc.data();
      const subscribed: unknown = data.subscribedCourses;

      if (Array.isArray(subscribed)) {
        for (const subscribedCourseId of subscribed) {
          if (typeof subscribedCourseId === "string") {
            reverseMap[subscribedCourseId] = baseCourseId;
          }
        }
      }
    });

    localStorage.setItem(`subscriptions`, JSON.stringify(reverseMap));

    console.log(`Cached subscribed → base course map for ${uid}`, reverseMap);
  } catch (error) {
    console.error("Failed to cache subscribed → base course map:", error);
  }
}
