"use client";

import Image from "next/image";
import { Channel } from "@/utils/interfaces";
import LoadingScreen from "./loading";
import { IconPlus } from "@tabler/icons-react";

interface ChannelDisplayProps {
  channel: Channel;
  link?: string;
  onPlusClick?: () => void;
  onManageCourseClick?: () => void;
}

export function ChannelDisplay({
  channel,
  onPlusClick,
  onManageCourseClick,
}: ChannelDisplayProps) {
  if (!channel) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-[var(--card)] rounded-xl overflow-hidden shadow-lg">
      {channel.bannerURL && (
        <div className="w-full h-48 relative">
          <Image
            src={channel.bannerURL}
            alt="Channel Banner"
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4">
        <div className="flex items-start space-x-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
              <Image
                src={channel.profilePicURL}
                alt="Profile Picture"
                width={80}
                height={80}
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-semibold text-white break-words">
                {channel.displayName}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:ml-auto">
          {onManageCourseClick && (
            <button
              onClick={onManageCourseClick}
              className="text-white px-4 py-2 rounded-md hover:bg-zinc-800 transition border text-sm"
              title="Manage"
            >
              Manage Questions
            </button>
          )}

          {onPlusClick && (
            <button
              onClick={onPlusClick}
              className="text-white p-2 rounded-md hover:bg-zinc-800 transition border"
              title="Create"
            >
              <IconPlus className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
