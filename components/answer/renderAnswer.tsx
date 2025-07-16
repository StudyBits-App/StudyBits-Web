import { QuestionAnswer } from "@/utils/interfaces";

interface Props {
  answer: QuestionAnswer;
  onSelect: (a: QuestionAnswer) => void;
  disabled: boolean;
  submitted: boolean;
}

export function AnswerChoiceCard({ answer, onSelect, disabled, submitted }: Props) {
  const base =
    "w-full p-4 rounded-xl border transition-all text-left cursor-pointer shadow-sm";
  const getClass = () => {
    if (!submitted) return answer.isSelected
      ? "border-blue-500 bg-zinc-900 border-teal-700"
      : "border-zinc-700 bg-zinc-900";
    if (answer.isSelected && answer.answer) return "border-green-500 bg-green-950 ring-2 ring-green-500";
    if (!answer.isSelected && answer.answer) return "border-green-500 bg-zinc-900";
    if (answer.isSelected && !answer.answer) return "border-red-500 bg-red-950 ring-2 ring-red-500";
    return "border-zinc-700 bg-zinc-900";
  };

  return (
    <div
      className={`${base} ${getClass()} text-white`}
      onClick={() => !disabled && onSelect(answer)}
    >
      <p className="text-base font-medium">{answer.content}</p>
    </div>
  );
}
