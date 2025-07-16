"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AnswerHint,
  QuestionAnswer,
  QuestionMetadata,
  RawQuestionMetadata,
} from "@/utils/interfaces";
import { useAuth } from "@/hooks/authContext";
import { getCourseUnitNamesFromId } from "@/services/channelHelpers";
import { shuffleArray } from "@/utils/utils";
import {
  getQuestionInfoById,
  incrementUserAccuracy,
  incrementViews,
} from "@/services/answerHelpers";
import { AnswerBottomBar } from "@/components/answer/bottom-bar";
import { AnswerHintCard } from "@/components/answer/renderHint";
import { AnswerChoiceCard } from "@/components/answer/renderAnswer";
import LoadingScreen from "@/components/loading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { createCourseUnitSelector } from "@/utils/getCombination";

const AnswerPage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questionsQueue, setQuestionsQueue] = useState<QuestionMetadata[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );
  const [question, setQuestion] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answersSubmitted, setAnswersSubmitted] = useState(false);
  const [answerChoices, setAnswerChoices] = useState<QuestionAnswer[]>([]);
  const [hints, setHints] = useState<AnswerHint[]>([]);
  const courseIdRef = useRef<string | null>(null);
  const [courseName, setCourseName] = useState<string | null>(null);
  const [unitName, setUnitName] = useState<string | null>(null);

  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(
    null
  );
  const [selectedUnitName, setSelectedUnitName] = useState<string | null>(null);
  const [selector, setSelector] = useState<Awaited<
    ReturnType<typeof createCourseUnitSelector>
  > | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!selector) return;
    console.log("[fetchQuestions] Started");

    setAnswersSubmitted(false);
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await selector.fetchApiResponse();
      console.log("[fetchQuestions] API response:", response);

      if (!Array.isArray(response)) {
        return;
      }

      const [data, courseId, unitId] = response;
      const names = await getCourseUnitNamesFromId(courseId, unitId);
      if (names) {
        setSelectedCourseName(names.courseName);
        setSelectedUnitName(names.unitName);
      }

      const questions: QuestionMetadata[] = (
        data.similar_courses as RawQuestionMetadata[]
      ).flatMap(({ course_id, course_name, unit_name, questions }) =>
        (questions || []).map((questionId) => ({
          questionId,
          courseId: course_id,
          courseName: course_name,
          unitName: unit_name,
        }))
      );

      const queue = shuffleArray(questions);
      if (queue.length === 0) {
        setErrorMessage("No new questions available.");
        return;
      }

      setQuestionsQueue(queue);
      setCurrentQuestionId(queue[0].questionId);
      courseIdRef.current = queue[0].courseId;
    } catch (err) {
      console.error("[fetchQuestions] Error:", err);
      setErrorMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [selector]);

  const fetchQuestionInfo = useCallback(
    async (id: string) => {
      setAnswerChoices([]);
      setHints([]);
      setQuestion("");
      setAnswersSubmitted(false);

      try {
        const data = await getQuestionInfoById(id);
        if (!data) return;
        console.log(id);
        console.log(questionsQueue);
        const meta = questionsQueue.find((q) => q.questionId === id);
        console.log(meta);
        if (meta) {
          setCourseName(meta.courseName);
          setUnitName(meta.unitName);
        }

        setAnswerChoices(
          data.answers.map((a, i) => ({
            key: `${a.key}-${Date.now()}-${i}`,
            content: a.content,
            answer: a.answer,
            isSelected: false,
          }))
        );
        setHints(data.hints || []);
        setQuestion(data.question || "");
      } catch (error) {
        console.error("[fetchQuestionInfo] Failed", error);
      }
    },
    [questionsQueue]
  );

  const nextQuestion = () => {
    if (questionsQueue.length === 0) {
      selector?.reset?.();
      fetchQuestions();
      return;
    }

    const [, ...rest] = questionsQueue;
    const next = rest[0];

    setQuestionsQueue(rest);
    setCurrentQuestionId(next.questionId);
    courseIdRef.current = next.courseId;
    setAnswersSubmitted(false);
  };

  useEffect(() => {
    if (user?.uid) {
      createCourseUnitSelector(user.uid).then(setSelector);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (selector) fetchQuestions();
  }, [selector, fetchQuestions]);

  useEffect(() => {
    if (currentQuestionId) fetchQuestionInfo(currentQuestionId);
  }, [currentQuestionId, fetchQuestionInfo]);

  useEffect(() => {
    console.log("[answerChoices]", answerChoices);
  }, [answerChoices]);

  const updateUserAccuracy = async () => {
    for (const answer of answerChoices) {
      if (answer.isSelected && !answer.answer) return;
    }

    try {
      if (user?.uid) {
        await incrementUserAccuracy(user.uid);
        console.log("[updateUserAccuracy] Incremented accuracy");
      }
    } catch (error) {
      console.error("[updateUserAccuracy] Failed", error);
    }
  };

  const handleSubmitAnswers = () => {
    setAnswersSubmitted(true);
    console.log("[handleSubmitAnswers] Submitted");

    if (courseIdRef.current && currentQuestionId) {
      console.log(
        "[handleSubmitAnswers] Incrementing views:",
        currentQuestionId
      );
      incrementViews(courseIdRef.current, currentQuestionId);
    }

    updateUserAccuracy();
  };

  const toggleSelectedAnswer = (inputAnswer: QuestionAnswer) => {
    console.log("[toggleSelectedAnswer] Toggling:", inputAnswer.key);
    setAnswerChoices((prev) =>
      prev.map((answer) =>
        answer.key === inputAnswer.key
          ? { ...answer, isSelected: !answer.isSelected }
          : answer
      )
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

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

      <SidebarInset className="px-8 py-10 space-y-10 bg-zinc-950 min-h-screen">
        <div className="space-y-6">
          {errorMessage && (
            <p className="text-center text-sm">{errorMessage}</p>
          )}

          {selectedCourseName && selectedUnitName && (
            <div className="w-fit mx-auto px-4 py-2 rounded-lg bg-zinc-900">
              <p className="text-sm text-zinc-300 text-center">
                {selectedCourseName}{" "}
                <span className="mx-2 text-zinc-500">·</span> {selectedUnitName}
              </p>
            </div>
          )}

          {question && (
            <div className="bg-zinc-900 rounded-xl p-6">
              <h2 className="text-white">{question}</h2>
            </div>
          )}

          <div className="space-y-4">
            {hints.map((hint) => (
              <AnswerHintCard key={hint.key} hint={hint} />
            ))}
          </div>

          <div className="bg-zinc-900 rounded-xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {answerChoices.map((answer) => (
                <AnswerChoiceCard
                  key={answer.key}
                  answer={answer}
                  onSelect={toggleSelectedAnswer}
                  disabled={answersSubmitted}
                  submitted={answersSubmitted}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <button
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 h-12 rounded-xl flex items-center justify-center text-sm font-semibold transition border border-zinc-600"
              onClick={nextQuestion}
              title="Skip this question"
            >
              Skip
            </button>

            <button
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 h-12 rounded-xl flex items-center justify-center text-sm font-semibold transition"
              onClick={answersSubmitted ? nextQuestion : handleSubmitAnswers}
              title={answersSubmitted ? "Next Question" : "Check Answer"}
            >
              {answersSubmitted ? "Next Question" : "Check Answer"}
            </button>
          </div>
        </div>

        {currentQuestionId && courseName && unitName && (
          <AnswerBottomBar
            questionId={currentQuestionId}
            courseName={courseName}
            unitName={unitName}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AnswerPage;
