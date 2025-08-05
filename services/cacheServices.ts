import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

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
