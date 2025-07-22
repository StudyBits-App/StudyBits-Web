import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  increment,
} from "firebase/firestore";

const db = getFirestore();

export const updateUseUnitsPreference = async (
  uid: string,
  courseId: string,
  useUnits: boolean
): Promise<void> => {
  try {
    const courseRef = doc(db, "learning", uid, "courses", courseId);
    await setDoc(courseRef, { useUnits }, { merge: true });
  } catch (error) {
    console.error("Error in updateUseUnitsPreference:", error);
    throw error;
  }
};

export const fetchCourseInteractionData = async (
  uid: string,
  courseId: string
): Promise<{
  isStudied: boolean;
  useUnits: boolean;
  studyingUnits: string[];
}> => {
  try {
    const courseRef = doc(db, "learning", uid, "courses", courseId);
    const courseSnap = await getDoc(courseRef);

    let useUnits = false;
    let studyingUnits: string[] = [];
    const isStudied = courseSnap.exists();

    if (isStudied) {
      const data = courseSnap.data();
      useUnits = data?.useUnits ?? false;
      studyingUnits = data?.studyingUnits ?? [];

      if (useUnits && studyingUnits.length > 0) {
        const unitChecks = await Promise.all(
          studyingUnits.map(async (unitId) => {
            const unitRef = doc(db, "courses", courseId, "units", unitId);
            const unitSnap = await getDoc(unitRef);
            return unitSnap.exists();
          })
        );

        const allUnitsExist = unitChecks.every(Boolean);
        if (!allUnitsExist) {
          console.warn(
            `[Interaction] One or more studyingUnits are invalid for course ${courseId}. Resetting.`
          );
          useUnits = false;
          studyingUnits = [];
        }
      }
    }

    return {
      isStudied,
      useUnits,
      studyingUnits,
    };
  } catch (error) {
    console.error("Error in fetchCourseInteractionData:", error);
    throw error;
  }
};

export const addCourseToUserLearning = async (
  uid: string,
  courseId: string
): Promise<void> => {
  try {
    const learningCourseRef = doc(db, "learning", uid, "courses", courseId);
    await setDoc(learningCourseRef, { studyingUnits: [], useUnits: false });

    const courseRef = doc(db, "courses", courseId);
    await setDoc(courseRef, { dependency: increment(1) }, { merge: true });
  } catch (error) {
    console.error("Error in addCourseToUserLearning:", error);
    throw error;
  }
};

export const toggleStudyingUnit = async (
  uid: string,
  courseId: string,
  currentUnits: string[],
  unitId: string
): Promise<string[]> => {
  try {
    const newUnits = [...currentUnits];
    const index = newUnits.indexOf(unitId);

    if (index > -1) {
      newUnits.splice(index, 1);
    } else {
      newUnits.push(unitId);
    }

    const courseRef = doc(db, "learning", uid, "courses", courseId);
    await setDoc(courseRef, { studyingUnits: newUnits }, { merge: true });

    return newUnits;
  } catch (error) {
    console.error("Error in toggleStudyingUnit:", error);
    throw error;
  }
};

export const getSubscribedCourses = async (
  courseId: string
): Promise<string[]> => {
  try {
    const mapStr = localStorage.getItem("subscriptions");
    if (!mapStr) return [];

    const map = JSON.parse(mapStr) as Record<string, string>;

    const subscribedCourses = Object.entries(map)
      .filter(([, base]) => base === courseId)
      .map(([sub]) => sub);

    return subscribedCourses;
  } catch (error) {
    console.error("Error in getSubscribedCourses (cache version):", error);
    return [];
  }
};
