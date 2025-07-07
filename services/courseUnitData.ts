import { db } from "@/firebase/firebase";
import { Course, Unit } from "@/utils/interfaces";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

export const getCourseData = async (courseId: string): Promise<Course> => {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);
    return courseSnapshot.data() as Course;
  } catch (error) {
    console.error("Error fetching channel data: ", error);
    throw error;
  }
};

export async function getUnitsForCourse(courseId: string): Promise<Unit[]> {
  if (!courseId) throw new Error("courseId is required");

  try {
    const unitsRef = collection(db, "courses", courseId, "units");
    const q = query(unitsRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    const units: Unit[] = snapshot.docs.map((doc) => doc.data() as Unit);
    return units;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
}

export async function saveUnit(courseId: string, unit: Unit): Promise<void> {
  const unitRef = doc(db, "courses", courseId, "units", unit.key);
  await setDoc(unitRef, unit, { merge: true });
}

export async function deleteUnit(courseId: string, unitId: string): Promise<void> {
  const unitRef = doc(db, "courses", courseId, "units", unitId);
  await deleteDoc(unitRef);
}
