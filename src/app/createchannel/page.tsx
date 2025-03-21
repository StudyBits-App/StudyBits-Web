"use client";

/* eslint-disable @next/next/no-img-element */
import { db } from "@/firebase/firebase";
import { useAuth } from "@/hooks/authContext";
import { uploadImageToFirebase } from "@/sevices/handleImages";
import { doc, setDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react"
import styles from './page.module.css'

const CreateChannelPage: React.FC = () => {
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [profilePicImage, setProfilePicImage] = useState<File | null>(null);
  const [defaultProfilePicUrl, setDefaultProfilePicUrl] = useState<
    string | null
  >(null);
  const [displayName, setDisplayName] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      const url = `https://robohash.org/${user?.uid}`;
      setDefaultProfilePicUrl(url);
    }
  }, [user]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBannerImage(e.target.files[0]);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setProfilePicImage(e.target.files[0]);
    }
  };

  const handleCreateChannel = async () => {
    if (!displayName.trim()) {
      alert("You must provide a display name!");
      return;
    }

    try {
      let bannerURL = "";
      let profilePicURL = "";

      if (bannerImage) {
        const bannerURI = URL.createObjectURL(bannerImage);
        bannerURL = await uploadImageToFirebase(bannerURI, "banners");
      }

      if (profilePicImage) {
        const profilePicURI = URL.createObjectURL(profilePicImage);
        profilePicURL = await uploadImageToFirebase(
          profilePicURI,
          "profilePics"
        );
      } else if (defaultProfilePicUrl) {
        profilePicURL = defaultProfilePicUrl;
      }

      await setDoc(doc(db, "channels", user?.uid as string), {
        displayName,
        bannerURL,
        profilePicURL,
      });

      console.log("Channel created:", {
        bannerURL,
        profilePicURL,
        displayName,
      });
    } catch (error) {
      console.error("Error uploading or saving:", error);
      alert("Failed to save images. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <div>
        {bannerImage ? (
          <div>
            <img
              src={URL.createObjectURL(bannerImage)}
              alt="Banner"
              className={styles.bannerImage}
            />
            <button
              onClick={() => setBannerImage(null)}
              className={styles.removeBtn}
            >
              Remove
            </button>
          </div>
        ) : (
          <label className={styles.uploadBox}>
            Upload Banner Image
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              hidden
            />
          </label>
        )}
      </div>

      <div className={styles.profileSection}>
        <img
          src={
            profilePicImage
              ? URL.createObjectURL(profilePicImage)
              : defaultProfilePicUrl || ""
          }
          alt="Profile"
          className={styles.profilePic}
          onClick={() => profilePicImage && setProfilePicImage(null)}
        />

        <label className={styles.uploadProfileBtn}>
          Upload Profile Picture
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            hidden
          />
        </label>
      </div>

      <input
        type="text"
        placeholder="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className={styles.input}
      />

      <button onClick={handleCreateChannel} className={styles.createBtn}>
        Create Channel
      </button>
    </div>
  );
};

export default CreateChannelPage;
