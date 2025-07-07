"use client";

import Image from "next/image";
import { Channel } from "@/utils/interfaces"; 
import LoadingScreen from "./loading";

interface ChannelDisplayProps {
  channel: Channel;
}

export function ChannelDisplay({ channel }: ChannelDisplayProps) {

  if (!channel) {
    return <LoadingScreen/>
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

      <div className="flex items-center p-6 space-x-4 bg-zinc-900">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-zinc-700">
          <Image
            src={channel.profilePicURL}
            alt="Profile Picture"
            width={80}
            height={80}
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {channel.displayName}
          </h1>
        </div>
      </div>
    </div>
  );
}
