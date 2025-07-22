"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Course, Question, Unit } from "@/utils/interfaces";
import {
  deleteQuestionFromUnit,
  getQuestionsForCourseUnit,
} from "@/services/questionData";
import { useRouter } from "next/navigation";
import { CourseDialog } from "@/components/course-unit-selector";
import { cacheCoursesAndUnits } from "@/services/cacheServices";
import { useAuth } from "@/hooks/authContext";

export default function ManageQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsDrafts, setQuestionDrafts] = useState<Question[]>([]);
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [courseOpen, setCourseOpen] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function getQuestions() {
      if (courseId && unitId) {
        const publishedQuestions = await getQuestionsForCourseUnit(
          courseId,
          unitId,
          false
        );
        const draftQuestions = await getQuestionsForCourseUnit(
          courseId,
          unitId,
          true
        );
        setQuestions(publishedQuestions);
        setQuestionDrafts(draftQuestions);
      }
    }

    if (courseId && unitId) {
      getQuestions();
      cacheCoursesAndUnits(user?.uid as string);
    }
  }, [courseId, router, unitId, user?.uid]);

  const publishEditRedirect = (questionId: string) => {
    router.push(`/questionPortal/publish/${questionId}`);
  };

  const draftEditRedirect = (questionId: string) => {
    router.push(`/questionPortal/publish/${questionId}`);
  };

const handleUnitSelect = (course: Course, unit: Unit | null) => {
  if (!unit) return;
  setCourseId(course.key);
  setUnitId(unit.key);
};


  const renderQuestionList = (
    questions: Question[],
    isDraft: boolean,
    title: string
  ) => (
    <>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {questions.length > 0 ? (
        questions.map((question) => (
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
                onClick={() =>
                  isDraft
                    ? draftEditRedirect(question.id)
                    : publishEditRedirect(question.id)
                }
                className="p-2 rounded-lg bg-zinc-600 hover:bg-zinc-500"
                title="Edit Question"
              >
                <IconPencil className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() =>
                  deleteQuestionFromUnit(
                    courseId as string,
                    unitId as string,
                    question.id,
                    isDraft
                  )
                }
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                title="Delete Question"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-zinc-400">
          No {isDraft ? "draft" : "published"} questions for this unit
        </p>
      )}
    </>
  );

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
        <div className="bg-zinc-900 rounded-xl p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">
            Manage Questions
          </h1>
          <button
            onClick={() => setCourseOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
          >
            Change Course / Unit
          </button>
        </div>

        {courseId && unitId ? (
          <>
            {renderQuestionList(questions, false, "Published Questions")}
            {renderQuestionList(questionsDrafts, true, "Draft Questions")}
          </>
        ) : (
          <div className="bg-zinc-900 rounded-xl p-4 shadow-sm">
            <p className="text-zinc-400">Please select a course and unit.</p>
          </div>
        )}

        <CourseDialog
          open={courseOpen}
          onOpenChange={setCourseOpen}
          onUnitSelect={handleUnitSelect}
          type={"channel"}
          cache={true}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
