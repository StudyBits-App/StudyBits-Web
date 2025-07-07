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

export function CourseDialog({
  open,
  onOpenChange,
  onUnitSelect,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onUnitSelect: (courseId: string, unitId: string) => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, Unit[]>>({});

  useEffect(() => {
    if (!open) return;

    const loadedCourses: Course[] = [];
    const newUnitMap: Record<string, Unit[]> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith("course-")) {
        try {
          const item = localStorage.getItem(key);
          if (item) loadedCourses.push(JSON.parse(item));
        } catch (error) {
          console.warn("Failed to parse course:", key, error);
        }
      }

      if (key.startsWith("unit-")) {
        const parts = key.split("-");
        if (parts.length >= 3) {
          const courseId = parts[1];
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const unit = JSON.parse(item) as Unit;
              if (!newUnitMap[courseId]) newUnitMap[courseId] = [];
              newUnitMap[courseId].push(unit);
            } catch {
              console.warn("Failed to parse unit:", key);
            }
          }
        }
      }
    }

    setCourses(loadedCourses);
    setUnitMap(newUnitMap);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">Courses</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {courses.map((course) => (
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
                        onUnitSelect(course.key, unit.key);
                      }}
                    >
                      {unit.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
