import { db } from "@/firebase/firebase";
import {
  DraftQuestion,
  EditingQuestion,
  Hint,
  Question,
} from "@/utils/interfaces";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteImageFromFirebase, uploadImageToFirebase } from "./handleImages";

export const convertHintsForUpload = async (hints: Hint[]): Promise<Hint[]> => {
  const uploadedHints: Hint[] = await Promise.all(
    hints.map(async (hint): Promise<Hint> => {
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

export const getQuestionDataWithId = async (
  id: string,
  draft: boolean
): Promise<Question | null> => {
  const questionRef = draft
    ? doc(db, "questionDrafts", id)
    : doc(db, "questions", id);

  const questionSnap = await getDoc(questionRef);
  const data = questionSnap.data();
  if (!data) return null;

  return {
    id: questionSnap.id,
    question: data.question,
    hints: data.hints,
    answers: data.answers,
    course: data.course,
    unit: data.unit,
  } as Question;
};
export async function submitNewQuestion({
  question,
  hints,
  answers,
  course,
  unit,
}: Question): Promise<"success" | "error"> {
  const questionData = {
    question,
    hints,
    answers,
    course: course,
    unit: unit,
  };

  const unitDocRef = doc(db, "courses", course, "units", unit);
  const courseDocRef = doc(db, "courses", course);
  const unitDocSnap = await getDoc(unitDocRef);

  if (!unitDocSnap.exists()) {
    return "error";
  }

  try {
    const questionDocRef = await addDoc(
      collection(db, "questions"),
      questionData
    );

    await updateDoc(unitDocRef, {
      questions: arrayUnion(questionDocRef.id),
    });

    await updateDoc(courseDocRef, {
      numQuestions: increment(1),
    });

    return "success";
  } catch (error) {
    console.error("Error writing question to Firestore:", error);
    return "error";
  }
}

export async function submitDraft({
  question,
  hints,
  answers,
  course,
  unit,
}: DraftQuestion): Promise<"success" | "error"> {
  const questionData = {
    question,
    hints,
    answers,
    course: course,
    unit: unit,
  };

  const unitDocRef = doc(db, "courses", course, "units", unit);
  const unitDocSnap = await getDoc(unitDocRef);

  if (!unitDocSnap.exists()) {
    return "error";
  }

  try {
    const questionDocRef = await addDoc(
      collection(db, "questionDrafts"),
      questionData
    );

    await updateDoc(unitDocRef, {
      questionDrafts: arrayUnion(questionDocRef.id),
    });

    return "success";
  } catch (error) {
    console.error("Error writing question to Firestore:", error);
    return "error";
  }
}

export async function editDraft({
  question,
  hints,
  answers,
  course,
  unit,
  id,
  oldCourse,
  oldUnit,
}: DraftQuestion & { oldCourse: string; oldUnit: string }): Promise<
  "success" | "error"
> {
  const questionRef = doc(db, "questionDrafts", id);

  const questionData = {
    question,
    hints,
    answers,
    course,
    unit,
  };

  try {
    if (oldCourse !== course || oldUnit !== unit) {
      const oldUnitRef = doc(db, "courses", oldCourse, "units", oldUnit);
      const newUnitRef = doc(db, "courses", course, "units", unit);

      const oldUnitSnap = await getDoc(oldUnitRef);
      const newUnitSnap = await getDoc(newUnitRef);

      if (!oldUnitSnap.exists() || !newUnitSnap.exists()) {
        throw new Error("One of the unit documents does not exist.");
      }

      await updateDoc(oldUnitRef, {
        questionDrafts: arrayRemove(id),
      });

      await updateDoc(newUnitRef, {
        questionDrafts: arrayUnion(id),
      });
    }
    await setDoc(questionRef, questionData, { merge: true });

    return "success";
  } catch (error) {
    console.error("Error editing draft question:", error);
    return "error";
  }
}

export const draftToPublish = async (
  id: string,
  course: string,
  unit: string
): Promise<"success" | "error"> => {
  try {
    const draftRef = doc(db, "questionDrafts", id);
    const snapshot = await getDoc(draftRef);

    if (!snapshot.exists()) {
      console.error("Draft not found.");
      return "error";
    }

    const data = snapshot.data();
    const questionRef = doc(db, "questions", id);
    await setDoc(questionRef, data, { merge: true });
    await deleteDoc(draftRef);

    const unitRef = doc(db, "courses", course, "units", unit);
    const courseRef = doc(db, "courses", course);

    await updateDoc(unitRef, {
      questionDrafts: arrayRemove(id),
      questions: arrayUnion(id),
    });

    await updateDoc(courseRef, {
      numQuestions: increment(1),
    });

    return "success";
  } catch (error) {
    console.error("Error converting draft to published:", error);
    return "error";
  }
};

export const publishToDraft = async (
  id: string,
  course: string,
  unit: string
): Promise<"success" | "error"> => {
  try {
    const questionRef = doc(db, "questions", id);
    const snapshot = await getDoc(questionRef);

    if (!snapshot.exists()) {
      console.error("Published question not found.");
      return "error";
    }

    const data = snapshot.data();

    const draftRef = doc(db, "questionDrafts", id);
    await setDoc(draftRef, data, { merge: true });
    await deleteDoc(questionRef);

    const unitRef = doc(db, "courses", course, "units", unit);
    const courseRef = doc(db, "courses", course);

    await updateDoc(unitRef, {
      questions: arrayRemove(id),
      questionDrafts: arrayUnion(id),
    });

    await updateDoc(courseRef, {
      numQuestions: increment(-1),
    });

    return "success";
  } catch (error) {
    console.error("Error converting published to draft:", error);
    return "error";
  }
};

export const handleHintImages = async (
  hints: Hint[],
  oldHints: Hint[] = []
): Promise<Hint[]> => {
  return await Promise.all(
    hints.map(async (hint, index) => {
      const oldHint = oldHints[index];

      // Case 1: New image is a File (needs upload)
      if (hint.image instanceof File) {
        const imageRef = await uploadImageToFirebase(hint.image, "questions");

        // If an old image exists and is different, delete the old one
        if (oldHint?.image && typeof oldHint.image === "string") {
          await deleteImageFromFirebase(oldHint.image);
        }

        return { ...hint, image: imageRef };
      }

      // Case 2: Image was removed (null), delete the old one
      if (!hint.image && oldHint?.image && typeof oldHint.image === "string") {
        await deleteImageFromFirebase(oldHint.image);
      }

      // Case 3: Image is unchanged (string), just return hint
      return hint;
    })
  );
};

export const submitEditedQuestion = async (
  editingQuestion: EditingQuestion
): Promise<"success" | "error"> => {
  try {
    const updatedHints = await handleHintImages(
      editingQuestion.hints,
      editingQuestion.oldHints
    );

    if (
      editingQuestion.course !== editingQuestion.oldCourse ||
      editingQuestion.unit !== editingQuestion.oldUnit
    ) {
      const oldUnitRef = doc(
        db,
        "courses",
        editingQuestion.oldCourse,
        "units",
        editingQuestion.oldUnit
      );
      const oldCourseRef = doc(db, "courses", editingQuestion.oldCourse);

      const newUnitRef = doc(
        db,
        "courses",
        editingQuestion.course,
        "units",
        editingQuestion.unit
      );
      const newCourseRef = doc(db, "courses", editingQuestion.course);

      const oldUnitSnap = await getDoc(oldUnitRef);
      const newUnitSnap = await getDoc(newUnitRef);

      if (!oldUnitSnap.exists() || !newUnitSnap.exists()) {
        throw new Error("One of the unit documents does not exist.");
      }

      await updateDoc(oldCourseRef, {
        numQuestions: increment(-1),
      });

      await updateDoc(newCourseRef, {
        numQuestions: increment(1),
      });

      await updateDoc(oldUnitRef, {
        questions: arrayRemove(editingQuestion.id),
      });

      await updateDoc(newUnitRef, {
        questions: arrayUnion(editingQuestion.id),
      });
    }

    const questionRef = doc(db, "questions", editingQuestion.id);

    const updatedQuestion: Question = {
      id: editingQuestion.id,
      question: editingQuestion.question,
      hints: updatedHints,
      answers: editingQuestion.answers,
      course: editingQuestion.course,
      unit: editingQuestion.unit,
    };

    await setDoc(questionRef, updatedQuestion, { merge: true });
    return "success";
  } catch (error) {
    console.error("Error editing question:", error);
    return "error";
  }
};
