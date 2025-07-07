import { db } from "@/firebase/firebase";
import { Course, Hint, HintUpload, Unit } from "@/utils/interfaces";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { uploadImageToFirebase } from "./handleImages";

export async function cacheCoursesAndUnits(uid: string) {
  try {
    const channelRef = doc(db, "channels", uid);
    const snapshot = await getDoc(channelRef);
    const data = snapshot.data();
    const courses = data?.courses;

    for (const courseEntry of courses) {
      const courseId =
        typeof courseEntry === "string" ? courseEntry : courseEntry?.id;

      if (!courseId) continue;

      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) continue;

      const courseData = courseSnap.data() as Course;
      localStorage.setItem(`course-${courseId}`, JSON.stringify(courseData));

      const unitsRef = collection(db, "courses", courseId, "units");
      const unitsSnap = await getDocs(unitsRef);

      unitsSnap.forEach((unitDoc) => {
        const unitData = unitDoc.data() as Unit;
        const unitKey = `unit-${courseId}-${unitDoc.id}`;
        if (unitData) {
          localStorage.setItem(unitKey, JSON.stringify(unitData));
        }
      });
    }
  } catch (error) {
    console.error("Error caching courses and units:", error);
  }
}

export const convertHintsForUpload = async (
  hints: Hint[]
): Promise<HintUpload[]> => {
  const uploadedHints: HintUpload[] = await Promise.all(
    hints.map(async (hint): Promise<HintUpload> => {
      if (hint.image instanceof File) {
        const url = await uploadImageToFirebase(hint.image, "questions");
        return {
          key: hint.key,
          title: hint.title,
          content: hint.content,
          image: url,
        };
      }

      return {
        key: hint.key,
        title: hint.title,
        content: hint.content,
        image: "",
      };
    })
  );

  return uploadedHints;
};
