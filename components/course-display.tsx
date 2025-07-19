"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Course } from "@/utils/interfaces";
import { getCourseData } from "@/services/courseUnitData";
import LoadingScreen from "./loading";

interface CourseDisplayProps {
  courseId: string;
  cache: boolean;
}

export function CourseDisplay({ courseId, cache }: CourseDisplayProps) {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        let data: Course | null = null;

        if (cache) {
          const cached = localStorage.getItem(`channel-course-${courseId}`);
          if (cached) {
            try {
              data = JSON.parse(cached);
              setCourse(data);
            } catch {
              console.warn(
                "Invalid cached course data, falling back to fetch."
              );
            }
          }
        }

        if (!data) {
          data = await getCourseData(courseId);
          setCourse(data);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
      }
    }

    fetchCourse();
  }, [courseId, cache]);

  if (!course) return <LoadingScreen />;

  return (
    <Card className="w-full bg-zinc-900 rounded-xl shadow-md">
      <CardContent className="flex items-center gap-6 p-6">
        {course.picUrl && (
          <div className="w-24 h-24 relative rounded-full overflow-hidden shrink-0 border border-zinc-700">
            <Image
              src={course.picUrl}
              alt="Course Icon"
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-white leading-tight">
            {course.name}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl">
            {course.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
