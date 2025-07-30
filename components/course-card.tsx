"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Channel, Course } from "@/utils/interfaces";
import { getCourseData } from "@/services/courseUnitData";
import LoadingScreen from "./loading";
import { getChannelData } from "@/services/channelHelpers";

interface CourseCardProps {
  courseId?: string;
  link: string;
  course?: Course;
  channel?: boolean;
}

export function CourseCard({
  courseId,
  link,
  course: initialCourse,
  channel,
}: CourseCardProps) {
  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [courseChannel, setCourseChannel] = useState<Channel | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        if (!initialCourse && courseId) {
          const data = await getCourseData(courseId);
          setCourse(data);

          if (channel) {
            const channelData = await getChannelData(data.creator);
            setCourseChannel(channelData);
          }
        } else if (initialCourse && channel) {
          const channelData = await getChannelData(initialCourse.creator);
          setCourseChannel(channelData);
        }
      } catch (err) {
        console.error("Failed to fetch course or channel:", err);
      }
    }
    fetchCourse();
  }, [courseId, initialCourse, channel]);

  if (!course) return <LoadingScreen />;

  const needsExpansion = course.description && course.description.length > 120;

  return (
    <Link href={`${link}/${course.key}`} className="block">
      <motion.div
        initial={false}
        animate={{
          height: expanded ? "auto" : "180px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full bg-[var(--card)] border border-zinc-800 rounded-xl hover:shadow-lg transition-shadow duration-200 flex flex-col"
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex-1 px-4 pt-4 flex items-center justify-center">
          <div className="w-full flex items-start space-x-4">
            {course.picUrl && (
              <motion.div>
                <div className="w-14 h-14 relative rounded-full overflow-hidden shrink-0 border border-zinc-700">
                  <Image
                    src={course.picUrl}
                    alt="Course Icon"
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>
            )}

            <div className="flex-1 min-w-0">
              <motion.div
                initial={false}
                animate={{
                  height: expanded ? "auto" : "1.5rem",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <h2 className="text-white font-semibold text-base leading-snug mb-2 break-words">
                  {course.name}
                </h2>
              </motion.div>

              <motion.div
                initial={false}
                animate={{
                  height: expanded ? "auto" : "1.25rem",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                  {course.description}
                </p>
              </motion.div>

              {needsExpansion && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className={`text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors relative z-10 ${
                    expanded ? "mt-3 mb-4" : "mt-3"
                  }`}
                >
                  {expanded ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          </div>
        </div>

        {channel && courseChannel && (
          <div className="px-4 pb-4">
            <div className="flex items-center space-x-2 pt-3 border-t border-zinc-800">
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
          </div>
        )}
      </motion.div>
    </Link>
  );
}