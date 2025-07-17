"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Course, Channel } from "@/utils/interfaces";
import { trimText } from "@/utils/utils";
import clsx from "clsx";
import { getCourseData } from "@/services/courseUnitData";
import { getChannelData } from "@/services/channelHelpers";

interface SubscriberListProps {
  link?: string;
  ids: string[];
}

export default function SubscriberList({ link, ids }: SubscriberListProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<
    { course: Course; channel: Channel | null }[]
  >([]);

  useEffect(() => {
    const loadAll = async () => {
      const loaded = await Promise.all(
        ids.map(async (id) => {
          try {
            const courseSnap = await getCourseData(id);
            const course = courseSnap as Course;

            let channel: Channel | null = null;
            if (course.creator) {
              const channelSnap = await getChannelData(course.creator);
              channel = channelSnap as Channel;
            }

            return { course, channel };
          } catch (err) {
            console.error("Failed to load course:", err);
            return null;
          }
        })
      );
      setCourses(loaded.filter(Boolean) as { course: Course; channel: Channel | null }[]);
    };

    loadAll();
  }, [ids]);

  const handleClick = (courseId: string) => {
    if (link) {
      router.push(`${link}/${courseId}`);
    }
  };

  if (courses.length === 0) {
    return (
      <p className="text-sm text-zinc-400 mt-4">
        You have no subscriptions for this course. Explore!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {courses.map(({ course, channel }) => (
        <div
          key={course.key}
          onClick={() => handleClick(course.key)}
          className={clsx(
            "rounded-lg border bg-zinc-900 p-4 cursor-pointer transition hover:border-zinc-600",
            "border-zinc-700"
          )}
        >
          <div className="flex items-center space-x-4">
            {course.picUrl && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white shrink-0">
                <Image
                  src={course.picUrl}
                  alt="Course"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-white font-medium text-sm truncate">
                {trimText(course.name || "Untitled Course", 32)}
              </p>
              {course.description && (
                <p className="text-zinc-400 text-xs mt-1 truncate">
                  {trimText(course.description, 50)}
                </p>
              )}
              {channel?.displayName && (
                <p className="text-zinc-500 text-xs mt-1 truncate">
                  by {channel.displayName}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}