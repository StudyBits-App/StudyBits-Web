"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Channel } from "@/utils/interfaces";
import { getChannelData } from "@/sevices/getUserData";
import styles from "./ChannelComponent.module.css";

interface ChannelDisplayProps {
  id: string;
  displayBanner: boolean;
}

const ChannelDisplay: React.FC<ChannelDisplayProps> = ({
  id,
  displayBanner,
}) => {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        const channelSnapshot = await getChannelData(id);
        if (channelSnapshot.exists()) {
          setChannel(channelSnapshot.data() as Channel);
        } else {
          console.log("Channel not found");
        }
      } catch (error) {
        console.error("Error fetching channel data: ", error);
      }
    };
    fetchChannelData();
  }, [id]);

  if (!channel) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.channelIsland}>
      {channel.bannerURL && displayBanner && (
        <div className={styles.bannerImageWrapper}>
          <Image
            src={channel.bannerURL}
            alt="Banner"
            width={800}
            height={200}
            objectFit="cover"
            className={styles.bannerImage}
          />
        </div>
      )}
      <div className={styles.profileSection}>
        <Image
          src={channel.profilePicURL || `https://robohash.org/${id}`}
          alt="Profile Picture"
          width={100}
          height={100}
          className={styles.profilePic}
        />
        <h3 className={styles.displayName}>
          {channel.displayName || "Default Display Name"}
        </h3>
      </div>
    </div>
  );
};

export default ChannelDisplay;
