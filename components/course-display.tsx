"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Course } from "@/utils/interfaces";
import { getCourseData } from "@/services/courseUnitData";
import LoadingScreen from "./loading";
import Link from "next/link";

interface CourseDisplayProps {
  courseId: string;
  link?: string;
}

export function CourseDisplay({ courseId, link }: CourseDisplayProps) {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await getCourseData(courseId);
        setCourse(data);
      } catch (err) {
        console.error("Failed to fetch course:", err);
      }
    }

    fetchCourse();
  }, [courseId]);

  if (!course) return <LoadingScreen />;

  const content = (
    <Card className="w-full bg-[var(--card)] rounded-xl shadow-md">
      <CardContent className="flex items-center gap-6 p-6">
        {course.picUrl && (
          <div className="w-24 h-24 relative rounded-full overflow-hidden shrink-0">
            <Image
              src={course.picUrl}
              alt="Course Icon"
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col w-full">
          <h1 className="text-2xl font-semibold text-white leading-tight break-words w-full">
            {course.name}
          </h1>

          {course.description && (
            <p className="text-sm text-zinc-400 mt-2 break-words w-full">
              {course.description}
            </p>
          )}

          <div className="flex items-center mt-2 text-zinc-400 text-sm">
            {course.numSubscribers !== undefined && (
              <div className="flex items-center gap-1">
                {course.numSubscribers} subscribers
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return link ? (
    <Link href={`${link}/${courseId}`} className="block">
      {content}
    </Link>
  ) : (
    <div>{content}</div>
  );
}
