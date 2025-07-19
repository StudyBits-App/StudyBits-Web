"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChannelDisplay } from "@/components/channel-display";
import { CourseCard } from "@/components/course-card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getChannelData } from "@/services/channelHelpers";
import { Channel } from "@/utils/interfaces";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChannelPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const router = useRouter();
  const [notFoundError, setNotFoundError] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    async function fetchChannel() {
      try {
        const data = await getChannelData(id as string);
        if (data === null) {
          setNotFoundError(true);
        }
        setChannel(data);
      } catch (error) {
        console.error("Failed to fetch channel data", error);
      }
    }

    fetchChannel();
  }, [id, router]);

  if (notFoundError) {
    notFound();
  }
  
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
            <ChannelDisplay channel={channel} />
            {channel.courses?.length > 0 && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {channel.courses.map((courseId) => (
                  <div key={courseId} className="h-full">
                    <CourseCard courseId={courseId} link="/viewCourse" cache={false}/>
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
