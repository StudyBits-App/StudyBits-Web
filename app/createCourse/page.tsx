"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Course, defaultCourse } from "@/utils/interfaces";
import { useAuth } from "@/hooks/authContext";
import { uploadImageToFirebase } from "@/services/handleImages";
import { v4 as uuidv4, v4 } from "uuid";
import { createNewCourse } from "@/services/courseUnitData";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { classifyCourse } from "@/utils/classify";
import LoadingScreen from "@/components/loading";

export default function CreateCoursePage() {
  const [course, setCourse] = useState<Course>({
    ...defaultCourse,
    key: uuidv4(),
  });
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCourse({ ...course, picUrl: URL.createObjectURL(file) });
    }
  };

  const handleCreate = async () => {
    if (!course.name.trim()) {
      alert("Course name is required");
      return;
    }

    if (course.name.length > 100) {
      alert(`Course name must be less than ${100} characters.`);
      return;
    }

    if (course.description && course.description.length > 1000) {
      alert(
        `Course description must be less than ${1000} characters.`
      );
      return;
    }

    try {
      setLoading(true);
      const tags = await classifyCourse(course.name);
      if ("tags" in tags && tags.tags.length > 0) {
        console.log(tags.tags);
        if (course.picUrl && course.picUrl.startsWith("blob:")) {
          const file = await fetch(course.picUrl).then((res) => res.blob());
          const uploadedUrl = await uploadImageToFirebase(file, "coursePics");
          course.picUrl = uploadedUrl;
        }
        const id = v4();
        console.log(id);
        const uploadedCourse = await createNewCourse(
          user?.uid as string,
          course,
          id,
          tags.tags
        );
        console.log(uploadedCourse);
        setLoading(false);
        router.push(`/manageCourse/${id}`);
      } else {
        console.warn("Classification failed");
      }
    } catch (error) {
      console.error("Error creating course:", error);
    }
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
      <SidebarInset className="p-6 space-y-6 min-h-screen">
        <div className="py-12 space-y-6 px-6 min-h-screen">
          <h1 className="text-white text-2xl font-bold">Create a Course</h1>

          <div className="space-y-4 bg-[var(--card)] rounded-xl p-6">
            <div className="flex items-center space-x-4">
              {course.picUrl ? (
                <Image
                  src={course.picUrl}
                  alt="Course Image"
                  width={96}
                  height={96}
                  className="rounded-full border border-zinc-600 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-white">
                  No Image
                </div>
              )}
              <label className="bg-zinc-800 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-800 transition">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden bg-zinc-800"
                />
              </label>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-white text-sm">Course Name</label>
              <input
                type="text"
                value={course.name}
                onChange={(e) => setCourse({ ...course, name: e.target.value })}
                placeholder="Enter course name"
                className="text-white bg-zinc-900 border border-zinc-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-white text-sm">Course Description</label>
              <textarea
                rows={4}
                value={course.description}
                onChange={(e) =>
                  setCourse({ ...course, description: e.target.value })
                }
                placeholder="Enter a brief description"
                className="bg-zinc-900 border border-zinc-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            {loading ? (
              <LoadingScreen />
            ) : (
              <Button
                onClick={handleCreate}
                className="mt-4 bg-teal-600 hover:bg-teal-500"
              >
                Create Course
              </Button>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
