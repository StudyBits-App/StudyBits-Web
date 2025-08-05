import { db } from "@/firebase/firebase";
import { Course } from "@/utils/interfaces";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { uploadImageToFirebase, deleteImageFromFirebase } from "./handleImages";

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
      tags: tags,
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

export const handleCourseImages = async (
  updatedCourse: Course & { picFile?: File },
  originalCourse: Course
): Promise<string> => {
  const result: Course = { ...updatedCourse };

  // Case 1 or 2: New or changed image using File
  if (updatedCourse.picFile) {
    if (originalCourse.picUrl) {
      await deleteImageFromFirebase(originalCourse.picUrl);
    }
    const uploadedUrl = await uploadImageToFirebase(
      updatedCourse.picFile,
      "coursePics"
    );
    result.picUrl = uploadedUrl;
  }
  // Case 3: Image removed
  else if (!updatedCourse.picUrl && originalCourse.picUrl) {
    await deleteImageFromFirebase(originalCourse.picUrl);
    result.picUrl = "";
  }

  return result.picUrl;
};

export const submitEditedCourse = async (
  uid: string,
  updatedCourse: Course & { picFile?: File },
  originalCourse: Course,
  tags: string[]
): Promise<Course> => {
  try {
    const pic = await handleCourseImages(updatedCourse, originalCourse);
    const courseCopy = { ...updatedCourse };
    delete courseCopy.picFile;

    const updatedCourseData = {
      ...courseCopy,
      picUrl: pic,
      lastModified: new Date().getTime(),
      tags: tags,
    };

    const courseRef = doc(db, "courses", updatedCourse.key);
    await setDoc(courseRef, updatedCourseData);
    return updatedCourseData;
  } catch (error) {
    console.error("Error in submitEditedCourse:", error);
    throw error;
  }
};
