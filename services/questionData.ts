import { db } from "@/firebase/firebase";
import { deleteDoc, doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { Question } from "@/utils/interfaces";

export async function getQuestionsForCourseUnit(
  courseId: string,
  unitId: string
): Promise<Question[] | undefined> {
  try {
    const unitRef = doc(db, "courses", courseId, "units", unitId);
    const unitSnapshot = await getDoc(unitRef);
    const questionIds: string[] | undefined = unitSnapshot.data()?.questions;
    if (!questionIds || questionIds.length === 0) return [];

    const questionDocs = await Promise.all(
      questionIds.map(async (qid) => {
        const questionRef = doc(db, "questions", qid);
        const questionSnap = await getDoc(questionRef);
        if (!questionSnap.exists()) return null;

        return {
          ...questionSnap.data(),
        } as Question;
      })
    );

    return questionDocs.filter((q): q is Question => q !== null);
  } catch (error) {
    console.error("Error caching courses and units:", error);
  }
}
export const deleteQuestionFromUnit = async (
  courseId: string,
  unitId: string,
  questionId: string
): Promise<void> => {
  try {
    const unitRef = doc(db, "courses", courseId, "units", unitId);
    const questionRef = doc(db, "questions", questionId);
    const courseRef = doc(db, "courses", courseId);

    const unitDoc = await getDoc(unitRef);
    if (!unitDoc.exists()) throw new Error("Unit not found");

    const unitData = unitDoc.data();
    const updatedQuestions = (unitData?.questions || []).filter(
      (id: string) => id !== questionId
    );

    await updateDoc(unitRef, { questions: updatedQuestions });
    await deleteDoc(questionRef);

    const courseDoc = await getDoc(courseRef);
    if (courseDoc.exists() && courseDoc.data()?.numQuestions) {
      await updateDoc(courseRef, {
        numQuestions: increment(-1),
      });
    }
  } catch (error) {
    console.error("Error in deleteQuestionFromUnit:", error);
    throw error;
  }
};