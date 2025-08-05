
"use client";
import Image from "next/image";
import { AnswerHint } from "@/utils/interfaces";

interface Props {
  hint: AnswerHint;
}

export function AnswerHintCard({ hint }: Props) {

  return (
    <div
      className="bg-[var(--card)] rounded-xl p-4 space-y-2 cursor-pointer"
    >
      {hint.title && <h3 className="text-white font-semibold">{hint.title}</h3>}
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
      {hint.content && <p className="text-zinc-300 text-base">{hint.content}</p>}
    </div>
  );
}