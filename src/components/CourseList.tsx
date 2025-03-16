"use client";

import { useState, useEffect } from "react";
import CourseCardShort from "./CourseCardShort";
import { getUserCourseList } from "@/sevices/getUserData";
import { useAuth } from "@/hooks/authContext";

interface CourseListProps {
  collectionName: string;
  link?: string;
  params?: { [key: string]: string | number };
}

const CourseList: React.FC<CourseListProps> = ({
  collectionName,
  params,
  link
}) => {
  const [courseIds, setCourseIds] = useState<string[] | null>(null); 
  const { user } = useAuth();

  useEffect(() => {
    const fetchLearningCourseIds = async () => {
      try {
        if (user?.uid) {
          const fetchedCourseIds = await getUserCourseList(user.uid);
          setCourseIds(fetchedCourseIds);
        } else {
          setCourseIds([]); 
        }
      } catch (error) {
        console.error("Error fetching learning course IDs:", error);
        setCourseIds([]);
      }
    };

    fetchLearningCourseIds();
  }, [user?.uid]);

  if (courseIds === null) {
    return <div>Loading courses...</div>;
  }

  return (
    <div>
      <div>
        {courseIds.map((courseId) => (
          <CourseCardShort
            id={courseId}
            key={courseId}
            link={link}
            params={{ ...params, id: courseId }}
          />
        ))}

        {courseIds.length === 0 && collectionName === "learningCourses" && (
          <p>
            You haven&apos;t started learning any courses yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default CourseList;
