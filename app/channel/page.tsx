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
        if (data === null) {
          router.replace("/createChannel");
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
      <SidebarInset className="p-6 space-y-6 bg-zinc-950 min-h-screen">
        {channel && (
          <>
            <ChannelDisplay
              channel={channel}
              onPlusClick={() => router.push("/createCourse")}
            />
            {channel.courses?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {channel.courses.map((courseId) => (
                  <CourseCard
                    key={courseId}
                    courseId={courseId}
                    link={"/manageCourse"}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
