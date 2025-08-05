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
import LoadingScreen from "./loading";

interface CourseDialogueProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onUnitSelect: (course: Course, unit: Unit | null) => void;
  courseOnly?: boolean;
  type: string;
  channelId?: string;
  allowNoUnit?: boolean;
  noCourseMessage: string
}
export function CourseDialog({
  open,
  onOpenChange,
  onUnitSelect,
  courseOnly = false,
  type,
  allowNoUnit = false,
  noCourseMessage
}: CourseDialogueProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, Unit[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;

    const loadCoursesAndUnits = async () => {
      try {
        setLoading(true);
        const { courses, unitMap } =
          type === "channel"
            ? await fetchChannelCoursesAndUnits(user?.uid as string)
            : await fetchLearningCoursesAndUnits(user?.uid as string);
        setCourses(courses);
        setUnitMap(unitMap);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch from Firebase:", err);
      }
    };

    loadCoursesAndUnits();
  }, [open, type, user?.uid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Courses</DialogTitle>
        </DialogHeader>

        {loading && <LoadingScreen />}

        <div className="space-y-4">
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
                  {allowNoUnit && (
                    <DropdownMenuItem
                      onClick={() => {
                        onOpenChange(false);
                        onUnitSelect(course, null);
                      }}
                    >
                      No unit
                    </DropdownMenuItem>
                  )}
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
          {courses.length === 0 && (
            <div className="text-center text-gray-400 p-4">
              {noCourseMessage}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
