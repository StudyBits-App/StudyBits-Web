"use client";

import Image from "next/image";
import { Channel } from "@/utils/interfaces";
import LoadingScreen from "./loading";
import { IconPlus } from "@tabler/icons-react";

interface ChannelDisplayProps {
  channel: Channel;
  onPlusClick?: () => void;
}

export function ChannelDisplay({ channel, onPlusClick }: ChannelDisplayProps) {
  if (!channel) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-lg">
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

      <div className="flex items-center justify-between p-6 bg-zinc-900">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-zinc-700">
            <Image
              src={channel.profilePicURL}
              alt="Profile Picture"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold text-white">
            {channel.displayName}
          </h1>
        </div>

        {onPlusClick && (
          <button
            onClick={onPlusClick}
            className="text-white p-2 rounded-md hover:bg-zinc-800 transition"
            title="Create"
          >
            <IconPlus className="w-10 h-10" />
          </button>
        )}
      </div>
    </div>
  );
}
