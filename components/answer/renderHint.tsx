
"use client";
import Image from "next/image";
import { AnswerHint } from "@/utils/interfaces";
import { trimText } from "@/utils/utils";

interface Props {
  hint: AnswerHint;
}

export function AnswerHintCard({ hint }: Props) {
  const truncatedTitle = trimText(hint.title, 100);
  const truncatedContent = trimText(hint.content, 400);

  return (
    <div
      className="bg-zinc-900 rounded-xl p-4 space-y-2 cursor-pointer"
    >
      {hint.title && <h3 className="text-white font-semibold">{truncatedTitle}</h3>}
      {hint.image && (
        <div className="w-full max-h-48 relative">
          <Image
            src={hint.image}
            alt="Hint"
            fill
            className="object-contain rounded-md"
          />
        </div>
      )}
      {hint.content && <p className="text-zinc-300 text-sm">{truncatedContent}</p>}
    </div>
  );
}