import axios from "axios";

type ClassificationResult =
  | { tags: string[] }
  | { error: true; message: string };

export const classifyCourse = async (
  courseName: string,
): Promise<ClassificationResult> => {
  try {
    const res = await axios.post("http://127.0.0.1:5000/courseClassify", {
      course_name: courseName,
    });

    if (res.data?.tags?.length > 0) {
      return { tags: res.data.tags };
    }

    return {
      error: true,
      message: "No tags found for this course.",
    };
  } catch (err) {
    console.error("[Selector] Fetch error:", err);
    return {
      error: true,
      message: "Failed to classify course.",
    };
  }
};

export const classifyUnit = async (
  unitName: string,
): Promise<ClassificationResult> => {
  try {
    const res = await axios.post("http://127.0.0.1:5000/unitClassify", {
      unit_name: unitName,
    });

    if (res.data?.tags?.length > 0) {
      return { tags: res.data.tags };
    }

    return {
      error: true,
      message: "No tags found for this unit.",
    };
  } catch (err) {
    console.error("[Selector] Fetch error:", err);
    return {
      error: true,
      message: "Failed to classify units.",
    };
  }
};

export const classifyQuestion = async (
  qId: string,
): Promise<ClassificationResult> => {
  try {
    const res = await axios.post("http://127.0.0.1:5000/questionClassify", {
      question_id: qId,
    });

    if (res.data?.tags?.length > 0) {
      return { tags: res.data.tags };
    }

    return {
      error: true,
      message: "No tags found for this question.",
    };
  } catch (err) {
    console.error("[Selector] Fetch error:", err);
    return {
      error: true,
      message: "Failed to classify question.",
    };
  }
};