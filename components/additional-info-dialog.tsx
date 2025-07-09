/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Hint } from "@/utils/interfaces";

export function AdditionalInfoDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onSubmit: (hint: Hint) => void;
  initialData?: Hint | null;
}) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null | string>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    setTitle(initialData?.title ?? "");
    setContent(initialData?.content ?? "");
    setImage(initialData?.image ?? null);
  }, [initialData, open]);

  const handleSubmit = () => {
    if (title && content) {
      onSubmit({
        key: initialData?.key || crypto.randomUUID(),
        title,
        content,
        image,
      });

      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">Additional Info</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <h1 className="mb-1 font-medium">Title</h1>
            <Input
              className="bg-zinc-800 border-zinc-600 text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
            />
          </div>
          <div>
            <h1 className="mb-1 font-medium">Image</h1>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImage(file);
                }}
                className="hidden"
              />

              <label
                htmlFor="image-upload"
                className="inline-block bg-zinc-800 text-white border border-zinc-600 px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-700"
              >
                {image ? "Change Image" : "Upload Image"}
              </label>

              {image && (
                <div className="space-y-2">
                  {typeof image === "string" ? (
                    <p className="text-sm text-zinc-400">Current: From upload </p>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      Selected:{" "}
                      {image.name.length > 40
                        ? image.name.slice(0, 40) + "..."
                        : image.name}
                    </p>
                  )}

                  <img
                    src={
                      typeof image === "string"
                        ? image
                        : URL.createObjectURL(image)
                    }
                    alt="Preview"
                    className="mt-2 max-h-48 w-full object-contain border border-zinc-700 rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <h1 className="mb-1 font-medium">Content</h1>
            <textarea
              className="bg-zinc-800 border border-zinc-600 text-white rounded-md w-full p-2 resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-zinc-500"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>
          <Button onClick={handleSubmit} className="bg-white text-black">
            {initialData ? "Update" : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
