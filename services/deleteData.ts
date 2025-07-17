import { db } from "@/firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

const deleteQuestionsForCourse = async (
  courseId: string
): Promise<void> => {
  try {
    const unitsRef = collection(db, "courses", courseId, "units");
    const unitsSnapshot = await getDocs(unitsRef);

    if (!unitsSnapshot.empty) {
      await Promise.all(
        unitsSnapshot.docs.map(async (unitDoc) => {
          const unitData = unitDoc.data();
          if (unitData?.questions?.length > 0) {
            await Promise.all(
              unitData.questions.map((questionId: string) =>
                deleteDoc(doc(db, "questions", questionId))
              )
            );
          }
        })
      );
      console.log("Deleted questions successfully for all units in the course");
    }
  } catch (error) {
    console.error("Error deleting questions for course:", error);
  }
};

const deleteUserChannelCourseDelete = async (courseId: string, userUid: string) => {
  try {
    const userChannelRef = doc(db, "channels", userUid);
    const userChannelDoc = await getDoc(userChannelRef);

    if (userChannelDoc.exists()) {
      const userChannelData = userChannelDoc.data();
      if (userChannelData?.courses && Array.isArray(userChannelData.courses)) {
        const updatedCourses = userChannelData.courses.filter(
          (id: string) => id !== courseId
        );
        await updateDoc(userChannelRef, { courses: updatedCourses });
      }
    }
    console.log(`Deletion complete for course ${courseId}.`);
  } catch (error) {
    console.error(
      `Error deleting course ${courseId} from user courses:`,
      error
    );
    return false;
  }
};


const handleUserCourseDeletion = async (courseId: string) => {
  try {
    const courseRef = doc(db, "courses", courseId);
    const courseDoc = await getDoc(courseRef);
    const courseData = courseDoc.data();

    if (courseDoc.exists() && courseData?.dependency > 0) {
      await updateDoc(courseRef, {
        creator: "TcoD2mfnDzQ6NmPQjbxzbpbUIJG3",
      });
    } else {
      await deleteDoc(courseRef);
    }
  } catch (error) {
    console.error("Error updating course:", error);
  }
};

export const handleChannelCourseDelete = async (courseId: string, uid: string) => {
    await deleteQuestionsForCourse(courseId);
    await deleteUserChannelCourseDelete(courseId, uid);
    await handleUserCourseDeletion(courseId);
};
