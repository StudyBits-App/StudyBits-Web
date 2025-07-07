"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Course } from "@/utils/interfaces";
import { getCourseData } from "@/services/courseUnitData";
import LoadingScreen from "./loading";

interface CourseCardProps {
  courseId: string;
  link: string
}

export function CourseCard({ courseId, link }: CourseCardProps) {
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

  return (
    <Link href={`${link}/${course.key}`} className="block">
      <Card className="w-64 aspect-square bg-zinc-900 hover:shadow-lg transition-shadow duration-200">
        <CardContent className="h-full flex items-center p-4 space-x-4">
          {course.picUrl && (
            <div className="w-14 h-14 relative rounded-full overflow-hidden shrink-0">
              <Image
                src={course.picUrl}
                alt="Course Icon"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="overflow-hidden">
            <h2 className="text-white font-semibold text-base line-clamp-1">
              {course.name}
            </h2>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-3">
              {course.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}