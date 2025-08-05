import { v4 as uuidv4 } from "uuid";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export const uploadImageToFirebase = async (
  file: File,
  folder: string
): Promise<string> => {
  const storage = getStorage();
  const filename = `${uuidv4()}-${(file as File).name}`;
  const storageRef = ref(storage, `${folder}/${filename}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

export const deleteImageFromFirebase = async (
  imageUrl: string
): Promise<void> => {
  try {
    const storage = getStorage();
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf("/o/") + 3;
    const endIndex = decodedUrl.indexOf("?");
    const filePath = decodedUrl.substring(startIndex, endIndex);

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log("Image deleted successfully");
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};
