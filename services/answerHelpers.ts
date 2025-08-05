import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  increment,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { QuestionInfo, QuestionMetadata } from "@/utils/interfaces";
import { getCourseData, getUnitForCourse } from "./courseUnitData";

const db = getFirestore();

export const getQuestionInfoById = async (
  questionId: string
): Promise<QuestionInfo | null> => {
  try {
    const questionRef = doc(db, "questions", questionId);
    const questionDoc = await getDoc(questionRef);

    if (questionDoc.exists()) {
      return questionDoc.data() as QuestionInfo;
    } else {
      console.error("Question not found with the given ID");
      return null;
    }
  } catch (error) {
    console.error("Error fetching question info:", error);
    throw error;
  }
};

export const idToAnswerElement = async (
  questionId: string
): Promise<QuestionMetadata> => {
  try {
    const questionData = await getQuestionInfoById(questionId);

    if (questionData?.course && questionData?.unit) {
      const courseData = await getCourseData(questionData.course);
      const unitData = await getUnitForCourse(
        courseData.key,
        questionData.unit
      );

      return {
        courseName: courseData.name,
        unitName: unitData.name,
        questionId,
        courseId: courseData.key,
      };
    }

    throw new Error("Missing course or unit data in question.");
  } catch (error) {
    console.error("Error converting ID to answer element:", error);
    throw error;
  }
};

export const checkIfLikeOrDislike = async (
  course: string,
  questionId: string,
  uid: string
): Promise<boolean | null> => {
  try {
    const courseDoc = doc(db, "learning", uid, "courses", course);
    const courseSnapshot = await getDoc(courseDoc);
    const likedQuestions = courseSnapshot.data()?.likedQuestions || [];
    const dislikedQuestions = courseSnapshot.data()?.dislikedQuestions || [];
    if (likedQuestions.includes(questionId)) {
      return true;
    }
    if (dislikedQuestions.includes(questionId)) {
      return false;
    }
    return null;
  } catch (error) {
    console.error("Error checking like or dislike:", error);
    throw error;
  }
};

export const getLikes = async (questionId: string): Promise<number> => {
  try {
    const questionRef = doc(db, "questions", questionId);
    const questionSnapshot = await getDoc(questionRef);
    if (questionSnapshot.exists()) {
      return questionSnapshot.data()?.likes || 0;
    } else {
      console.error("Question not found");
      return 0;
    }
  } catch (error) {
    console.error("Error fetching likes:", error);
    throw error;
  }
};

export const incrementLikes = async (
  course: string,
  uid: string,
  questionId: string
): Promise<void> => {
  try {
    const questionRef = doc(db, "questions", questionId);
    await setDoc(
      questionRef,
      {
        likes: increment(1),
      },
      { merge: true }
    );

    const courseRef = doc(db, "courses", course);
    await setDoc(
      courseRef,
      {
        likes: increment(1),
      },
      { merge: true }
    );

    const userCourseRef = doc(db, "learning", uid, "courses", course);
    await updateDoc(userCourseRef, {
      likedQuestions: arrayUnion(questionId),
    });
  } catch (error) {
    console.error("Error incrementing likes:", error);
    throw error;
  }
};

export const getDislikes = async (questionId: string): Promise<number> => {
  try {
    const questionDoc = doc(db, "questions", questionId);
    const questionSnapshot = await getDoc(questionDoc);
    return questionSnapshot.exists()
      ? questionSnapshot.data()?.dislikes || 0
      : 0;
  } catch (error) {
    console.error("Error fetching dislikes:", error);
    throw error;
  }
};

export const incrementDislikes = async (
  course: string,
  uid: string,
  questionId: string
): Promise<void> => {
  try {
    const questionDoc = doc(db, "questions", questionId);
    const courseDoc = doc(db, "courses", course);
    const userCourseDoc = doc(db, "learning", uid, "courses", course);

    await Promise.all([
      updateDoc(questionDoc, { dislikes: increment(1) }),
      setDoc(courseDoc, { dislikes: increment(1) }, { merge: true }),
      updateDoc(userCourseDoc, {
        dislikedQuestions: arrayUnion(questionId),
      }),
    ]);
  } catch (error) {
    console.error("Error incrementing dislikes:", error);
    throw error;
  }
};

export const removeLikeOrDislike = async (
  course: string,
  uid: string,
  questionId: string,
  isLike: boolean
): Promise<void> => {
  try {
    const questionDoc = doc(db, "questions", questionId);
    const courseDoc = doc(db, "courses", course);
    const userCourseDoc = doc(db, "learning", uid, "courses", course);

    if (isLike) {
      await Promise.all([
        updateDoc(questionDoc, { likes: increment(-1) }),
        updateDoc(courseDoc, { likes: increment(-1) }),
        updateDoc(userCourseDoc, {
          likedQuestions: arrayRemove(questionId),
        }),
      ]);
    } else {
      await Promise.all([
        updateDoc(questionDoc, { dislikes: increment(-1) }),
        updateDoc(courseDoc, { dislikes: increment(-1) }),
        updateDoc(userCourseDoc, {
          dislikedQuestions: arrayRemove(questionId),
        }),
      ]);
    }
  } catch (error) {
    console.error("Error removing like or dislike:", error);
    throw error;
  }
};

export const checkIfSubscribed = async (course: string): Promise<boolean> => {
  try {
    const mapStr = localStorage.getItem("subscriptions");
    if (!mapStr) return false;

    const map = JSON.parse(mapStr) as Record<string, string>;
    return course in map;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
};

export const subscribeToCourse = async (
  course: string,
  baseCourse: string,
  uid: string
): Promise<void> => {
  try {
    const userDoc = doc(db, "learning", uid, "courses", baseCourse);
    await updateDoc(userDoc, {
      subscribedCourses: arrayUnion(course),
    });

    const courseDoc = doc(db, "courses", course);
    await updateDoc(courseDoc, {
      numSubscribers: increment(1),
    });

    const mapStr = localStorage.getItem("subscriptions");
    const map: Record<string, string> = mapStr ? JSON.parse(mapStr) : {};
    map[course] = baseCourse;

    localStorage.setItem("subscriptions", JSON.stringify(map));
  } catch (error) {
    console.error("Error subscribing to course:", error);
    throw error;
  }
};

export const unsubscribeFromCourse = async (
  course: string,
  baseCourse: string,
  uid: string
): Promise<void> => {
  try {
    const userDoc = doc(db, "learning", uid, "courses", baseCourse);
    await updateDoc(userDoc, {
      subscribedCourses: arrayRemove(course),
    });

    const courseDoc = doc(db, "courses", course);
    await updateDoc(courseDoc, {
      numSubscribers: increment(-1),
    });

    const mapStr = localStorage.getItem("subscriptions");
    const map: Record<string, string> = mapStr ? JSON.parse(mapStr) : {};
    delete map[course];

    localStorage.setItem("subscriptions", JSON.stringify(map));
  } catch (error) {
    console.error("Error unsubscribing from course:", error);
    throw error;
  }
};

export const getViews = async (questionId: string): Promise<number> => {
  try {
    const questionDoc = doc(db, "questions", questionId);
    const questionSnapshot = await getDoc(questionDoc);
    if (questionSnapshot.exists()) {
      return questionSnapshot.data()?.views || 0;
    } else {
      console.error("Question not found");
      return 0;
    }
  } catch (error) {
    console.error("Error fetching question views:", error);
    throw error;
  }
};

export const incrementViews = async (
  chosenCourse: string,
  questionId: string
): Promise<void> => {
  try {
    const questionDoc = doc(db, "questions", questionId);
    const courseDoc = doc(db, "courses", chosenCourse);

    await Promise.all([
      updateDoc(questionDoc, { views: increment(1) }),
      setDoc(courseDoc, { views: increment(1) }, { merge: true }),
    ]);
  } catch (error) {
    console.error("Error incrementing views:", error);
    throw error;
  }
};

export const addAnsweredQuestion = async (
  questionId: string,
  uid: string,
  selectedCourse: string
): Promise<void> => {
  try {
    const userCourseDoc = doc(db, "learning", uid, "courses", selectedCourse);
    await updateDoc(userCourseDoc, {
      answeredQuestions: arrayUnion(questionId),
    });
  } catch (error) {
    console.error("Error adding answered question:", error);
    throw error;
  }
};