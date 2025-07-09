"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Question } from "@/utils/interfaces";
import {
  deleteQuestionFromUnit,
  getQuestionsForCourseUnit,
} from "@/services/questionData";
import { useParams, useRouter } from "next/navigation";

export default function CreateCoursePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const { id } = useParams();
  const [courseId, unitId] = (id as string).split("_");
  const router = useRouter();

  useEffect(() => {
    async function getQuestions() {
      const fetchedQuestions = await getQuestionsForCourseUnit(
        courseId,
        unitId
      );
      if (fetchedQuestions === undefined) router.replace("/channel");
      else setQuestions(fetchedQuestions);
    }
    getQuestions();
  }, [courseId, router, unitId]);

  const editRedirect = (questionId: string) => {
    router.push(`/questionPortal/${questionId}`);
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
        <h2 className="text-2xl font-semibold text-white">Questions</h2>

        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-zinc-900 rounded-xl p-4 shadow-sm flex items-center justify-between space-x-4"
          >
            <div className="flex-1">
              <p className="text-white text-sm truncate max-w-xl">
                {question.question}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => editRedirect(question.id)}
                className={"p-2 rounded-lg bg-zinc-600 hover:bg-zinc-500"}
                title={"Edit Question"}
              >
                <IconPencil className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() =>
                  deleteQuestionFromUnit(courseId, unitId, question.id)
                }
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                title="Delete Question"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <p>No questions for this unit</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}
