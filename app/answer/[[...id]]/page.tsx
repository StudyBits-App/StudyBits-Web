"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnswerHint,
  Course,
  QuestionAnswer,
  QuestionMetadata,
  RawQuestionMetadata,
  Unit,
} from "@/utils/interfaces";
import { useAuth } from "@/hooks/authContext";
import { getCourseUnitNamesFromId } from "@/services/channelHelpers";
import { shuffleArray } from "@/utils/utils";
import {
  addAnsweredQuestion,
  getQuestionInfoById,
  idToAnswerElement,
  incrementViews,
} from "@/services/answerHelpers";
import { AnswerBottomBar } from "@/components/answer/bottom-bar";
import { AnswerHintCard } from "@/components/answer/renderHint";
import { AnswerChoiceCard } from "@/components/answer/renderAnswer";
import LoadingScreen from "@/components/loading";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { createCourseUnitSelector } from "@/utils/getCombination";
import { CourseDialog } from "@/components/course-unit-selector";
import { AllCombos } from "@/components/answer/allCombos";
import { CorrectAnswerCelebration } from "@/components/answer/correct-answer-celebration";
import { notFound, useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

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
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [studyingCourse, setStudyingCourse] = useState<string | null>(null);
  const [studiedUnit, setStudiedUnit] = useState<string>("");

  const [selector, setSelector] = useState<Awaited<
    ReturnType<typeof createCourseUnitSelector>
  > | null>(null);

  const [allCombosUsed, setAllCombosUsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);

  const { id } = useParams();
  const flatId = useMemo(() => (Array.isArray(id) ? id : []), [id]);
  const isInParamMode = flatId.length > 0;

  const handleUnitSelect = (course: Course, unit: Unit | null) => {
    setStudyingCourse(course.key);
    setStudiedUnit(unit ? unit.key : "");
  };

  const fetchQuestions = useCallback(async () => {
    if (!selector) return;

    setAnswersSubmitted(false);
    setLoading(true);
    setErrorMessage(null);

    try {
      let response = {};
      if (studyingCourse) {
        response = await selector.fetchApiResponseWithIds(
          studyingCourse,
          studiedUnit
        );
      } else {
        response = await selector.fetchApiResponse();
      }

      console.log("[fetchQuestions] API response:", response);

      if (!Array.isArray(response)) {
        return;
      }

      const [data, courseId, unitId] = response;
      setSelectedCourseId(courseId);

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
        setErrorMessage("No questions available.");
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
  }, [selector, studiedUnit, studyingCourse]);

  const fetchQuestionInfo = useCallback(
    async (id: string) => {
      setHints([]);
      setQuestion("");
      setAnswerChoices([]);
      setAnswersSubmitted(false);

      try {
        const data = await getQuestionInfoById(id);
        if (!data) return;
        const meta = questionsQueue.find((q) => q.questionId === id);
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
    setShowConfetti(false);

    const [, ...rest] = questionsQueue;
    const next = rest[0];

    if (!next) {
      setQuestionsQueue([]);
      setCurrentQuestionId(null);
      selector?.reset?.();
      fetchQuestions();
      return;
    }

    setQuestionsQueue(rest);
    setCurrentQuestionId(next.questionId);
    courseIdRef.current = next.courseId;
    setAnswersSubmitted(false);
  };

  useEffect(() => {
    createCourseUnitSelector(user?.uid as string, () => {
      setAllCombosUsed(true);
    }).then(setSelector);
  }, [user?.uid]);

  useEffect(() => {
    if (!selector || isInParamMode) return;
    fetchQuestions();
  }, [selector, isInParamMode, fetchQuestions]);

  useEffect(() => {
    if (currentQuestionId) fetchQuestionInfo(currentQuestionId);
  }, [currentQuestionId, fetchQuestionInfo]);

  useEffect(() => {
    const initWithId = async () => {
      if (flatId.length === 0 || !selector) return;
      const questionId = flatId[0];

      try {
        const meta = await idToAnswerElement(questionId);
        if (meta) {
          setCourseName(meta.courseName);
          setUnitName(meta.unitName);
          setCurrentQuestionId(meta.questionId);
          courseIdRef.current = meta.courseId;
          setQuestionsQueue([{ ...meta }]);
        }
      } catch (error) {
        console.error("Failed to load question by ID:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (isInParamMode) {
      initWithId();
    }
  }, [flatId, selector, isInParamMode]);

  const handleSubmitAnswers = () => {
    setAnswersSubmitted(true);

    if (!isInParamMode) {
      addAnsweredQuestion(
        currentQuestionId as string,
        user?.uid as string,
        selectedCourseId as string
      );
      console.log("[handleSubmitAnswers] Submitted");
    }

    if (courseIdRef.current && currentQuestionId) {
      console.log(
        "[handleSubmitAnswers] Incrementing views:",
        currentQuestionId
      );
      incrementViews(courseIdRef.current, currentQuestionId);
    }

    const allCorrectSelected = answerChoices.every(
      (a) => (a.answer && a.isSelected) || (!a.answer && !a.isSelected)
    );

    setShowConfetti(allCorrectSelected);
  };

  const toggleSelectedAnswer = (inputAnswer: QuestionAnswer) => {
    setAnswerChoices((prev) =>
      prev.map((answer) =>
        answer.key === inputAnswer.key
          ? { ...answer, isSelected: !answer.isSelected }
          : answer
      )
    );
  };

  const handleCourseUnitReset = () => {
    setStudyingCourse(null);
    setStudiedUnit("");
  };

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
      <SidebarInset className="px-8 py-10 space-y-10 overflow-y-auto">
        <SiteHeader />

        <div className="space-y-6">
          {loading && <LoadingScreen />}
          {!currentQuestionId && !loading && (
            <p className="text-center text-sm">
              Hmm... looks like you aren&apos;t studying anything. Go out and
              explore!
            </p>
          )}
          {errorMessage && (
            <p className="text-center text-sm">{errorMessage}</p>
          )}

          {selectedCourseName && studyingCourse && (
            <div
              className="w-fit mx-auto px-4 py-2 rounded-lg bg-zinc-900"
              onClick={() => setCourseOpen(true)}
            >
              <p className="text-sm text-center font-outfit flex items-center gap-2">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #f43f5e, #3b82f6)",
                  }}
                >
                  {selectedCourseName}
                </span>

                {selectedUnitName && (
                  <>
                    <span className="text-zinc-500">·</span>
                    <span
                      className="bg-clip-text text-transparent"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #f43f5e, #3b82f6)",
                      }}
                    >
                      {selectedUnitName}
                    </span>
                  </>
                )}

                <span
                  className="text-zinc-400 hover:text-red-400 cursor-pointer text-lg"
                  onClick={handleCourseUnitReset}
                >
                  x
                </span>
              </p>
            </div>
          )}

          {selectedCourseName && !studyingCourse && (
            <div
              className="w-fit mx-auto px-4 py-2 rounded-lg bg-[var(--card)]"
              onClick={() => setCourseOpen(true)}
            >
              <p className="text-sm text-zinc-300 text-center">
                {selectedCourseName}
                {selectedUnitName && (
                  <>
                    <span className="mx-2 text-zinc-500">·</span>
                    {selectedUnitName}
                  </>
                )}
              </p>
            </div>
          )}

          {question && !loading && (
            <div className="bg-[var(--card)] rounded-xl p-6">
              <h2 className="text-white break-words whitespace-pre-wrap">
                {question}
              </h2>
            </div>
          )}

          {hints && !loading && (
            <div className="space-y-4">
              {hints.map((hint) => (
                <AnswerHintCard key={hint.key} hint={hint} />
              ))}
            </div>
          )}

          {answerChoices && !loading && (
            <div className="bg-[var(--card)] rounded-xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  return answerChoices.map((answer) => {
                    return (
                      <div key={answer.key} className="h-full w-full flex">
                        {showConfetti ? (
                          <CorrectAnswerCelebration>
                            <AnswerChoiceCard
                              answer={answer}
                              onSelect={toggleSelectedAnswer}
                              disabled={answersSubmitted}
                              submitted={answersSubmitted}
                            />
                          </CorrectAnswerCelebration>
                        ) : (
                          <AnswerChoiceCard
                            answer={answer}
                            onSelect={toggleSelectedAnswer}
                            disabled={answersSubmitted}
                            submitted={answersSubmitted}
                          />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {currentQuestionId && (
            <div className="flex justify-end pt-4 gap-3">
              <button
                className="bg-[var(--card)] hover:bg-zinc-700 text-white px-4 h-12 rounded-xl flex items-center justify-center text-sm font-semibold transition border border-zinc-600"
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
          )}
        </div>

        {currentQuestionId && courseName && unitName && courseIdRef && (
          <AnswerBottomBar
            questionId={currentQuestionId}
            courseName={courseName}
            unitName={unitName}
            selectedCourseId={selectedCourseId || undefined}
            courseId={courseIdRef.current as string}
          />
        )}

        <CourseDialog
          open={courseOpen}
          onOpenChange={setCourseOpen}
          onUnitSelect={handleUnitSelect}
          type={"learning"}
          cache={false}
        />

        <AllCombos open={allCombosUsed} onOpenChange={setAllCombosUsed} />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AnswerPage;
