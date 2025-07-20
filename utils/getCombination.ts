import axios from "axios";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { shuffleArray } from "./utils";
import { RawQuestionMetadata } from "./interfaces";

const db = getFirestore();

type Combo = { courseId: string; unitId: string };
type SuccessResponse = [RawQuestionMetadata, string, string];
type ErrorResponse = { error: true; message: string };
type ApiResponseResult = SuccessResponse | ErrorResponse;

export async function createCourseUnitSelector(uid: string) {
  const original: Combo[] = [];

  try {
    const coursesRef = collection(db, "learning", uid, "courses");
    const snapshot = await getDocs(coursesRef);

    snapshot.forEach((doc) => {
      const data = doc.data();
      const units = data?.useUnits ? data?.studyingUnits || [] : [""];
      units.forEach((unitId: string) => {
        original.push({ courseId: doc.id, unitId });
      });
    });
  } catch (err) {
    console.error("[Selector] Firestore fetch error:", err);
  }

  let index = 0;
  let lastCombo: Combo | null = null;

  const reset = () => {
    shuffleArray(original);
    if (lastCombo && original.length > 1) {
      if (
        original[0].courseId === lastCombo.courseId &&
        original[0].unitId === lastCombo.unitId
      ) {
        [original[0], original[1]] = [original[1], original[0]];
      }
    }

    index = 0;
    console.log("[Selector Reset] Shuffled again:", original);
  };

  const fetchApiResponse = async (): Promise<ApiResponseResult> => {
    if (original.length === 0) {
      return {
        error: true,
        message: "No available course/unit combinations.",
      };
    }

    if (index >= original.length) {
      console.log("[Selector] All combos exhausted. Resetting...");
      reset();
    }

    const combo = original[index];
    console.log(
      `[Selector] Trying combo ${index + 1}/${original.length}:`,
      combo.courseId,
      combo.unitId
    );

    try {
      const res = await axios.post(
        "https://study-bits-api.vercel.app/find_similar_courses",
        {
          course_id: combo.courseId,
          unit_id: combo.unitId,
          uid: uid
        }
      );

      index++;
      lastCombo = combo;

      if (res.data?.similar_courses?.length > 0) {
        console.log(
          `[Selector] Found results for`,
          combo.courseId,
          combo.unitId
        );
        return [res.data, combo.courseId, combo.unitId];
      } else {
        console.log(`[Selector] No results for`, combo.courseId, combo.unitId);
        return {
          error: true,
          message: `No results for courseId=${combo.courseId}, unitId=${combo.unitId}`,
        };
      }
    } catch (err) {
      index++;
      lastCombo = combo;
      console.error(
        `[Selector] API error for ${combo.courseId}, ${combo.unitId}:`,
        err
      );
      return {
        error: true,
        message: `API error for courseId=${combo.courseId}, unitId=${combo.unitId}`,
      };
    }
  };

  const fetchApiResponseWithIds = async (
    courseId: string,
    unitId: string
  ): Promise<ApiResponseResult> => {
    try {
      const res = await axios.post(
        "https://study-bits-api.vercel.app/find_similar_courses",
        {
          course_id: courseId,
          unit_id: unitId,
        }
      );

      if (res.data?.similar_courses?.length > 0) {
        return [res.data, courseId, unitId];
      }
    } catch (err) {
      console.error("[Selector] Fetch error:", err);
    }

    return {
      error: true,
      message: "No valid results found for the specified course/unit.",
    };
  };

  return {
    fetchApiResponse,
    fetchApiResponseWithIds,
    reset,
  };
}
