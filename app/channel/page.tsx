"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChannelDisplay } from "@/components/channel-display";
import { CourseCard } from "@/components/course-card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/authContext";
import { getChannelData } from "@/services/channelHelpers";
import { Channel } from "@/utils/interfaces";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChannelPage() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchChannel() {
      if (!user?.uid) return;
      try {
        const data = await getChannelData(user.uid);
        if(data === null) {
          router.push("/createChannel");
        }
        setChannel(data);
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
      <SidebarInset className="p-6 space-y-6 min-h-screen">
        {channel && (
          <>
            <ChannelDisplay
              channel={channel}
              onPlusClick={() => router.push("/createCourse")}
              onManageCourseClick={() => router.push("/manageQuestions")}
            />

            {channel.courses?.length > 0 && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {channel.courses.map((courseId) => (
                  <div key={courseId} className="h-full">
                    <CourseCard courseId={courseId} link="/manageCourse" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
