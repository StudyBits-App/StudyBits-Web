"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  IconEye,
  IconPencil,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Question } from "@/utils/interfaces";
import { getQuestionsForCourseUnit } from "@/services/questionData";
import { notFound, useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export default function ManageQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    async function initializeFromId() {
      if (!id || id.length < 2) {
        setError(true);
        return;
      }

      const [firstId, secondId] = Array.isArray(id) ? id : id.split("/");
      if (!firstId || !secondId) {
        setError(true);
        return;
      }

      setCourseId(firstId);
      setUnitId(secondId);

      const publishedQuestions = await getQuestionsForCourseUnit(
        firstId,
        secondId,
        false
      );
      setQuestions(publishedQuestions);
    }

    initializeFromId();
  }, [id]);

  const viewRedirect = (questionId: string) => {
    router.push(`/answer/${questionId}`);
  };

  const renderQuestionList = (questions: Question[], title: string) => (
    <>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {questions.length > 0 ? (
        questions.map((question) => (
          <div
            key={question.id as string}
            className="bg-[var(--card)] rounded-xl p-4 shadow-sm flex items-center justify-between space-x-4"
          >
            <div className="flex-1 overflow-hidden max-w-full">
              <p className="text-white text-sm break-words whitespace-pre-wrap overflow-hidden line-clamp-3">
                {question.question}
              </p>

              <div className="flex items-center gap-4 mt-2 text-zinc-400 text-xs">
                {question.likes !== undefined && (
                  <div className="flex items-center gap-1">
                    <IconThumbUp className="w-4 h-4" />
                    <span>{question.likes}</span>
                  </div>
                )}
                {question.dislikes !== undefined && (
                  <div className="flex items-center gap-1">
                    <IconThumbDown className="w-4 h-4" />
                    <span>{question.dislikes}</span>
                  </div>
                )}
                {question.views !== undefined && (
                  <div className="flex items-center gap-1">
                    <IconPencil className="w-4 h-4" />
                    <span>{question.views}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => viewRedirect(question.id as string)}
                className="p-2 rounded-lg bg-zinc-600 hover:bg-zinc-500"
                title="Edit Question"
              >
                <IconEye className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-zinc-400">No questions for this unit</p>
      )}
    </>
  );

  if (error) return notFound();

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
      <SidebarInset className="p-6 space-y-6 min-h-screen overflow-y-auto">
        <SiteHeader />
        <div className="bg-[var(--card)] rounded-xl p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">
            Manage Questions
          </h1>
        </div>

        {courseId && unitId && (
          <>{renderQuestionList(questions, "Questions")}</>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
