import { db } from "@/firebase/firebase";
import { Course, Unit } from "@/utils/interfaces";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
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

export async function getUnitForCourse(
  courseId: string,
  unitId: string
): Promise<Unit> {
  try {
    const unitRef = doc(db, "courses", courseId, "units", unitId);
    const snapshot = await getDoc(unitRef);
    const unit = snapshot.data() as Unit;
    return unit;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
}
export async function getUnitsForCourse(courseId: string): Promise<Unit[]> {
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

export const createNewCourse = async (
  uid: string,
  course: Course
): Promise<string> => {
  try {
    course.lastModified = new Date().getTime();
    const courseRef = await addDoc(collection(db, "courses"), course);
    const docId = courseRef.id;
    await updateDoc(courseRef, { key: docId, numQuestions: 0 });

    const channelRef = doc(db, "channels", uid);
    const channelDoc = await getDoc(channelRef);
    const currentCourses = channelDoc.data()?.courses || [];
    await updateDoc(channelRef, { courses: [...currentCourses, docId] });

    return docId;
  } catch (error) {
    console.error("Error in createNewCourse:", error);
    throw error;
  }
};

export const getAllLearningCourseIds = async (
  id: string
): Promise<string[]> => {
  try {
    const collectionRef = collection(db, "learning", id, "courses");
    const snapshot = await getDocs(collectionRef);

    return snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("Error fetching learning course IDs:", error);
    return [];
  }
};

export const fetchUnitsAndCourseCreator = async (id: string) => {
  try {
    const courseDoc = await getCourseData(id);
    const creatorId = courseDoc?.creator;

    if(!creatorId) {
      return undefined
    }

    const unitDocs = await getUnitsForCourse(id);
    const unitData: Unit[] = [];

    unitDocs.forEach((doc) => {
      const unit = doc as Unit;
      unitData.push(unit);
    });

    const sortedUnits = unitData.sort((a, b) => a.order - b.order);
    return { creatorId, sortedUnits };
  } catch (error) {
    console.error("Error fetching units and course creator: ", error);
  }
};