"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CourseCard } from "@/components/course-card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/authContext";
import { getAllLearningCourseIds } from "@/services/courseUnitData";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomepPage() {
  const { user } = useAuth();
  const [learningCourses, setLearningCourses] = useState<string[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchChannel() {
      if (!user?.uid) return;
      try {
        const data = await getAllLearningCourseIds(user.uid);
        setLearningCourses(data);
      } catch (error) {
        console.error("Failed to fetch channel data", error);
      }
    }

    fetchChannel();
  }, [router, user?.uid]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="p-6 space-y-6 bg-zinc-950 min-h-screen">
        {learningCourses && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {learningCourses.map((courseId) => (
              <div key={courseId} className="h-full">
                <CourseCard
                  courseId={courseId}
                  link={`/viewCourse`}
                />
              </div>
            ))}
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
