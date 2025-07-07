"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/authContext";
import { uploadImageToFirebase } from "@/services/handleImages";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  createOrUpdateChannel,
  getChannelData,
} from "@/services/channelHelpers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Channel } from "@/utils/interfaces";

export default function CreateChannelPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [profilePicImage, setProfilePicImage] = useState<File | null>(null);
  const [defaultProfilePicUrl, setDefaultProfilePicUrl] = useState<
    string | null
  >(null);
  const [displayName, setDisplayName] = useState("");
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    async function checkChannel() {
      const channel = await getChannelData(user?.uid as string);
      if (channel !== null) {
        setChannel(channel);
        router.replace("/channel");
      }
    }
    checkChannel();
    setDefaultProfilePicUrl(`https://robohash.org/${user?.uid}`);
  }, [router, user?.uid]);

  const handleImageChange =
    (setter: (file: File | null) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setter(file);
    };

  const handleCreateChannel = async () => {
    if (!displayName.trim()) {
      alert("Display name is required");
      return;
    }

    if(channel !== null) return;

    try {
      let bannerURL: string | null = null;
      let profilePicURL: string | null = null;

      if (bannerImage) {
        bannerURL = await uploadImageToFirebase(bannerImage, "banners");
      }

      if (profilePicImage) {
        profilePicURL = await uploadImageToFirebase(
          profilePicImage,
          "profilePics"
        );
      } else if (defaultProfilePicUrl) {
        profilePicURL = defaultProfilePicUrl;
      }

      if (user?.uid && profilePicURL) {
        await createOrUpdateChannel(
          user.uid,
          displayName,
          bannerURL || "",
          profilePicURL
        );
        router.push("/channel");
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
      alert("An error occurred while creating the channel");
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
      <SidebarInset className="p-6 space-y-6 bg-zinc-950 min-h-screen">
        <div className="py-12 space-y-6 px-6 bg-zinc-950 min-h-screen">
          <h1 className="text-white text-2xl font-bold">Create Your Channel</h1>

          <Card className="bg-zinc-900 p-10 space-y-2">
            <div className="flex flex-col space-y-2">
              <label className="text-white text-sm font-medium">
                Banner Image
              </label>
              <label className="bg-zinc-800 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-700 transition w-fit">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange(setBannerImage)}
                  className="hidden"
                />
              </label>
              {bannerImage && (
                <Image
                  src={URL.createObjectURL(bannerImage)}
                  alt="Banner Preview"
                  width={800}
                  height={200}
                  className="rounded-lg object-cover w-full h-40"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                Profile Picture
              </label>

              <div className="flex items-center space-x-4">
                <label className="bg-zinc-800 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-700 transition">
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange(setProfilePicImage)}
                    className="hidden"
                  />
                </label>

                {profilePicImage || defaultProfilePicUrl ? (
                  <Image
                    src={
                      profilePicImage
                        ? URL.createObjectURL(profilePicImage)
                        : defaultProfilePicUrl!
                    }
                    alt="Preview"
                    width={72}
                    height={72}
                    className="rounded-full border border-zinc-700 object-cover"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-col space-y-5">
              <label className="text-white text-sm font-medium">
                Display Name
              </label>
              <Input
                className="text-white"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your channel name"
              />
            </div>

            <Button className="w-full mt-4" onClick={handleCreateChannel}>
              Create Channel
            </Button>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
