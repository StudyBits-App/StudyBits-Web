"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CourseCard } from "@/components/course-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/authContext";
import { getAllLearningCourseIds } from "@/services/courseUnitData";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomepPage() {
  const { user } = useAuth();
  const [learningCourses, setLearningCourses] = useState<string[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchLearning() {
      if (!user?.uid) return;
      try {
        const data = await getAllLearningCourseIds(user.uid);
        setLearningCourses(data);
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch channel data", error);
      }
    }
    fetchLearning();
  }, [router, user?.uid]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
  };

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
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-white">
                What I&apos;m learining
              </h1>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex w-full md:w-auto items-center gap-2"
              >
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-400"
                />
                <button
                  type="submit"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                >
                  Search
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
        {learningCourses && learningCourses.length > 0 && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {learningCourses.map((courseId) => (
              <div key={courseId} className="h-full">
                <CourseCard
                  courseId={courseId}
                  link={`/viewCourse`}
                  cache={false}
                />
              </div>
            ))}
          </div>
        )}
        {learningCourses?.length === 0 && (
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
            <p className="text-sm">
              You aren&apos;t learning any courses. Pick some to get started!
            </p>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
