"use client";

import React from "react";
import Link from "next/link";
import ChannelDisplay from "@/components/ChannelComponent";
import { useAuth } from "@/hooks/authContext";
import styles from "./page.module.css";
import CourseList from "@/components/CourseList";

const AddCourse = () => {
  return (
    <Link href="/">
      <div className={styles.course}>
        <i
          className="icon ionicons-add-circle"
          style={{ fontSize: "70px", color: "#3B9EBF" }}
        ></i>
        <div>
          <h3 className={styles.courseName}>Add a Course</h3>
          <p className={styles.courseDescription}>
            It can be about anything you&apos;d like.
          </p>
        </div>
      </div>
    </Link>
  );
};

const UserChannelPage = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.paddedSection}>
        <ChannelDisplay id={user?.uid as string} displayBanner={true} />
      </div>
      <CourseList
        link="/"
      />
      <div className={styles.paddedSection}>
        <AddCourse />
      </div>
    </div>
  );
};

export default UserChannelPage;