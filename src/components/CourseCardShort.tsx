import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Course } from "@/utils/interfaces";
import styles from "./CourseCardShort.module.css";
import { trimText } from "@/utils/utils";
import { getCourseData } from "@/sevices/getUserData";
import { useRouter } from "next/navigation";

interface CourseCardShortProps {
  id: string;
  selected?: boolean;
  onPress?: () => void;
  link?: string;
  params?: { [key: string]: string | number };
  channelDisplay?: boolean;
}

const CourseCardShort: React.FC<CourseCardShortProps> = ({
  id,
  selected,
  onPress,
  link,
  params,
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseData = (await getCourseData(id)).data() as Course;
        setCourse(courseData);
      } catch (error) {
        console.error("Error fetching course: ", error);
      }
    };
    fetchCourse();
  }, [id]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (link) {
      const url = new URL(link, window.location.origin);
      if (params) {
        Object.keys(params).forEach((key) =>
          url.searchParams.append(key, String(params[key]))
        );
      }
      router.push(url.toString());
    }
  };

  if (!course) {
    return <div className={styles.loading}>Loading course...</div>;
  }

  return (
    <div
      className={`${styles.course} ${selected ? styles.selectedCourse : ""}`}
      onClick={handlePress}
    >
      <div className={styles.courseContent}>
        {course.picUrl && (
          <Image
            src={course.picUrl}
            alt={course.name || "Course Image"}
            className={styles.coursePic}
            width={70}
            height={70}
          />
        )}
        <div
          className={
            course.picUrl
              ? `${styles.courseInfoBox} ${styles.marginLeft}`
              : styles.courseInfoBox
          }
        >
          <h3 className={styles.courseName}>
            {trimText(course.name, 20) || "Default Course Name"}
          </h3>
          {course.description && (
            <p className={styles.courseDescription}>
              {trimText(course.description, 25)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCardShort;
