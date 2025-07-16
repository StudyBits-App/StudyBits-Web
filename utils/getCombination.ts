import axios from "axios";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { shuffleArray } from "./utils";

const db = getFirestore();

export async function createCourseUnitSelector(uid: string) {
  const original: { courseId: string; unitId: string }[] = [];

  try {
    const coursesRef = collection(db, "learning", uid, "courses");
    const snapshot = await getDocs(coursesRef);

    snapshot.forEach((doc) => {
      const data = doc.data();
      const units = data?.useUnits ? data?.studyingUnits || [] : [""];
      units.forEach((unitId: string) => {
        original.push({ courseId: doc.id, unitId });
      });
    });
  } catch (err) {
    console.error("Selector init error:", err);
  }

  let index = 0;
  shuffleArray(original);

  const reset = () => {
    shuffleArray(original);
    index = 0;
  };

  const fetchApiResponse = async () => {
    while (index < original.length) {
      const { courseId, unitId } = original[index++];
      try {
        const res = await axios.post("https://study-bits-api.vercel.app/find_similar_courses", {
          course_id: courseId,
          unit_id: unitId,
        });
        if (res.data?.similar_courses?.length > 0) {
          return [res.data, courseId, unitId];
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
    return { error: true, message: "No valid results found for any course unit combination." };
  };

  return { fetchApiResponse, reset };
}
