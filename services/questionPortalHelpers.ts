import { db } from "@/firebase/firebase";
import {
  Course,
  EditingQuestion,
  Hint,
  Question,
  Unit,
} from "@/utils/interfaces";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteImageFromFirebase, uploadImageToFirebase } from "./handleImages";

export async function cacheCoursesAndUnits(uid: string) {
  localStorage.clear();
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
  id: string
): Promise<Question | null> => {
  const questionRef = doc(db, "questions", id);
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
