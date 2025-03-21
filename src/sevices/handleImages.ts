import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const storage = getStorage();

const uploadImageToFirebase = async (file: string, folder: string) => {
  try {
    const storageRef = ref(storage, `${folder}/${Date.now()}`);
    const response = await fetch(file);
    const blob = await response.blob();
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image: ", error);
    throw error;
  }
};

const deleteImageFromFirebase = async (imageUrl: string) => {
  try {
    console.log(imageUrl);
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIndex = decodedUrl.indexOf("/o/") + 3;
    const endIndex = decodedUrl.indexOf("?");
    const filePath = decodedUrl
      .substring(startIndex, endIndex)
      .replace(/%2F/g, "/");

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log("Image deleted successfully");
  } catch (error) {
    console.error("Error deleting image: ", error);
    throw error;
  }
};

export { uploadImageToFirebase, deleteImageFromFirebase };
