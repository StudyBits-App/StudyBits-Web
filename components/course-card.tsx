"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Channel, Course } from "@/utils/interfaces";
import { getCourseData } from "@/services/courseUnitData";
import LoadingScreen from "./loading";
import { getChannelData } from "@/services/channelHelpers";

interface CourseCardProps {
  courseId: string;
  link: string;
  channel?: boolean;
}

export function CourseCard({ courseId, link, channel }: CourseCardProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [courseChannel, setCourseChannel] = useState<Channel | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await getCourseData(courseId);
        setCourse(data);
        if (channel) {
          const channelData = await getChannelData(data.creator);
          setCourseChannel(channelData);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
      }
    }
    fetchCourse();
  }, [channel, courseId]);

  if (!course) return <LoadingScreen />;

  return (
    <Link href={`${link}/${course.key}`} className="block h-full">
      <Card className="w-full h-full bg-zinc-900 hover:shadow-lg transition-shadow duration-200 border border-zinc-800">
        <CardContent className="h-full flex flex-col justify-between p-4 space-y-4">
          <div className="flex items-start space-x-4">
            {course.picUrl && (
              <div className="w-14 h-14 relative rounded-full overflow-hidden shrink-0 border border-zinc-700">
                <Image
                  src={course.picUrl}
                  alt="Course Icon"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <h2 className="text-white font-semibold text-base line-clamp-1">
                {course.name}
              </h2>
              <p className="text-sm text-zinc-400 mt-1 line-clamp-3">
                {course.description}
              </p>
            </div>
          </div>

          {channel && courseChannel && (
            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800 mt-auto">
              {courseChannel.profilePicURL && (
                <div className="w-6 h-6 relative rounded-full overflow-hidden">
                  <Image
                    src={courseChannel.profilePicURL}
                    alt="Channel Icon"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-zinc-400 truncate">
                {courseChannel.displayName}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}