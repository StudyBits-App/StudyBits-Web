/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Course, Unit } from "@/utils/interfaces";
import {
  fetchChannelCoursesAndUnits,
  fetchLearningCoursesAndUnits,
} from "@/services/courseUnitData";
import { useAuth } from "@/hooks/authContext";

interface CourseDialogueProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onUnitSelect: (course: Course, unit: Unit | null) => void;
  courseOnly?: boolean;
  type: string;
  channelId?: string;
  cache: boolean;
}
export function CourseDialog({
  open,
  onOpenChange,
  onUnitSelect,
  courseOnly = false,
  type,
  cache,
}: CourseDialogueProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, Unit[]>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    const getCache = () => {
      const loadedCourses: Course[] = [];
      const newUnitMap: Record<string, Unit[]> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.startsWith("channel-course-")) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const course = JSON.parse(item) as Course;
              loadedCourses.push(course);
            }
          } catch (error) {
            console.warn("Failed to parse course:", key, error);
          }
        }
        if (key.startsWith("channel-unit-")) {
          const withoutPrefix = key.replace("channel-unit-", ""); 
          const parts = withoutPrefix.split("-");
          if (parts.length < 6) {
            console.warn("Malformed unit key:", key);
            return;
          }

          const courseId = parts.slice(0, 5).join("-");
          const item = localStorage.getItem(key);

          if (item) {
            try {
              const unit = JSON.parse(item) as Unit;
              if (!newUnitMap[courseId]) newUnitMap[courseId] = [];
              newUnitMap[courseId].push(unit);
            } catch {
              console.warn("Failed to parse unit JSON for:", key);
            }
          }
        }
      }
      setCourses(loadedCourses);
      setUnitMap(newUnitMap);
    };

    const loadCoursesAndUnits = async () => {
      try {
        const { courses, unitMap } =
          type === "channel"
            ? await fetchChannelCoursesAndUnits(user?.uid as string)
            : await fetchLearningCoursesAndUnits(user?.uid as string);
        setCourses(courses);
        setUnitMap(unitMap);
      } catch (err) {
        console.error("Failed to fetch from Firebase:", err);
      }
    };
    if (cache) {
      getCache();
    } else {
      loadCoursesAndUnits();
    }
  }, [cache, open, type, user?.uid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">Courses</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {courses.map((course) =>
            courseOnly ? (
              <div
                key={course.key}
                className="flex items-center gap-4 bg-zinc-800 p-3 rounded-md border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition"
                onClick={() => {
                  onOpenChange(false);
                  onUnitSelect(course, null);
                }}
              >
                {course.picUrl && (
                  <img
                    src={course.picUrl}
                    alt={course.name}
                    className="h-12 w-12 rounded-full object-cover border border-zinc-600"
                  />
                )}
                <p className="text-lg">{course.name}</p>
              </div>
            ) : (
              <DropdownMenu key={course.key}>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-4 bg-zinc-800 p-3 rounded-md border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition">
                    {course.picUrl && (
                      <img
                        src={course.picUrl}
                        alt={course.name}
                        className="h-12 w-12 rounded-full object-cover border border-zinc-600"
                      />
                    )}
                    <p className="text-lg">{course.name}</p>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-800 border-zinc-600 text-white w-64">
                  {(unitMap[course.key] ?? []).length === 0 ? (
                    <DropdownMenuItem disabled>No units found</DropdownMenuItem>
                  ) : (
                    unitMap[course.key].map((unit) => (
                      <DropdownMenuItem
                        key={unit.key}
                        onClick={() => {
                          onOpenChange(false);
                          onUnitSelect(course, unit);
                        }}
                      >
                        {unit.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
