import { db } from "@/firebase/firebase";
import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { Question } from "@/utils/interfaces";

export async function getQuestionsForCourseUnit(
  courseId: string,
  unitId: string,
  draft: boolean
): Promise<Question[]> {
  try {
    const unitRef = doc(db, "courses", courseId, "units", unitId);
    const unitSnapshot = await getDoc(unitRef);
    const unitData = unitSnapshot.data();

    if (!unitData) return [];

    const questionIds: string[] = draft
      ? unitData.questionDrafts ?? []
      : unitData.questions ?? [];

    if (questionIds.length === 0) return [];

    const questionDocs = await Promise.all(
      questionIds.map(async (qid) => {
        const questionRef = doc(
          db,
          draft ? "questionDrafts" : "questions",
          qid
        );
        const questionSnap = await getDoc(questionRef);
        return questionSnap.exists() ? (questionSnap.data() as Question) : null;
      })
    );

    return questionDocs.filter((q): q is Question => q !== null);
  } catch (error) {
    console.error("Error fetching questions for course unit:", error);
    return [];
  }
}

export const deleteQuestionFromUnit = async (
  courseId: string,
  unitId: string,
  questionId: string,
  isDraft: boolean
): Promise<void> => {
  try {
    const unitRef = doc(db, "courses", courseId, "units", unitId);
    const questionRef = doc(
      db,
      isDraft ? "questionDrafts" : "questions",
      questionId
    );
    const courseRef = doc(db, "courses", courseId);

    const unitDoc = await getDoc(unitRef);
    if (!unitDoc.exists()) throw new Error("Unit not found");

    const unitData = unitDoc.data();
    const fieldKey = isDraft ? "questionDrafts" : "questions";

    const updatedQuestions = (unitData?.[fieldKey] || []).filter(
      (id: string) => id !== questionId
    );

    await updateDoc(unitRef, { [fieldKey]: updatedQuestions });
    await deleteDoc(questionRef);

    if (!isDraft) {
      const courseDoc = await getDoc(courseRef);
      if (courseDoc.exists() && courseDoc.data()?.numQuestions) {
        await updateDoc(courseRef, {
          numQuestions: increment(-1),
        });
      }
    }
  } catch (error) {
    console.error("Error in deleteQuestionFromUnit:", error);
    throw error;
  }
};
