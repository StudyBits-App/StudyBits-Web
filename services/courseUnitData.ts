import { db } from "@/firebase/firebase";
import { Course, Unit } from "@/utils/interfaces";
import {
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

export async function saveUnit(
  courseId: string,
  unit: Unit,
  tags: string[]
): Promise<void> {
  const unitRef = doc(db, "courses", courseId, "units", unit.key);

  await setDoc(
    unitRef,
    {
      ...unit,
      tags,
    },
    { merge: true }
  );
}

export const createNewCourse = async (
  uid: string,
  course: Course,
  id: string,
  tags: string[]
): Promise<Course> => {
  try {
    const courseRef = doc(db, "courses", id);
    const timestamp = new Date().getTime();

    const courseWithMeta = {
      ...course,
      key: id,
      lastModified: timestamp,
      numQuestions: 0,
      creator: uid,
      tags: tags
    };

    await setDoc(courseRef, courseWithMeta);

    const channelRef = doc(db, "channels", uid);
    const channelDoc = await getDoc(channelRef);
    const currentCourses = channelDoc.data()?.courses || [];

    await updateDoc(channelRef, {
      courses: [...currentCourses, id],
    });
    return courseWithMeta;
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

    if (!creatorId) {
      return undefined;
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

export async function fetchLearningCoursesAndUnits(uid: string): Promise<{
  courses: Course[];
  unitMap: Record<string, Unit[]>;
}> {
  const loadedCourses: Course[] = [];
  const newUnitMap: Record<string, Unit[]> = {};

  try {
    const userLearningRef = collection(db, "learning", uid, "courses");
    const learningSnap = await getDocs(userLearningRef);

    for (const docSnap of learningSnap.docs) {
      const courseId = docSnap.id;

      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) continue;

      const course = { ...courseSnap.data(), key: courseId } as Course;
      loadedCourses.push(course);

      const unitsRef = collection(db, "courses", courseId, "units");
      const unitsSnap = await getDocs(unitsRef);

      newUnitMap[courseId] = [];
      unitsSnap.forEach((unitDoc) => {
        newUnitMap[courseId].push(unitDoc.data() as Unit);
      });
    }

    return { courses: loadedCourses, unitMap: newUnitMap };
  } catch (error) {
    console.error("Error fetching learning courses and units:", error);
    return { courses: [], unitMap: {} };
  }
}

export async function fetchChannelCoursesAndUnits(uid: string): Promise<{
  courses: Course[];
  unitMap: Record<string, Unit[]>;
}> {
  const loadedCourses: Course[] = [];
  const newUnitMap: Record<string, Unit[]> = {};

  try {
    const channelRef = doc(db, "channels", uid);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) throw new Error("Channel not found");

    const channelData = channelSnap.data();
    const courseIds: string[] = channelData.courses || [];

    for (const courseId of courseIds) {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) continue;

      const course = { ...courseSnap.data(), key: courseId } as Course;
      loadedCourses.push(course);

      const unitsRef = collection(db, "courses", courseId, "units");
      const unitsSnap = await getDocs(unitsRef);

      newUnitMap[courseId] = [];
      unitsSnap.forEach((unitDoc) => {
        newUnitMap[courseId].push(unitDoc.data() as Unit);
      });
    }

    return { courses: loadedCourses, unitMap: newUnitMap };
  } catch (error) {
    console.error("Error fetching channel courses and units:", error);
    return { courses: [], unitMap: {} };
  }
}
