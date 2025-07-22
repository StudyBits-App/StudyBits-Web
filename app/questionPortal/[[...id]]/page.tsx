"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  IconPlus,
  IconCheck,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import {
  Answer,
  Course,
  EditingQuestion,
  Hint,
  Unit,
} from "@/utils/interfaces";
import { AdditionalInfoDialog } from "@/components/questionPortal/additional-info-dialog";
import { useAuth } from "@/hooks/authContext";
import {
  addTagsToQuestion,
  convertHintsForUpload,
  draftToPublish,
  editDraft,
  getQuestionDataWithId,
  handleHintImages,
  publishToDraft,
  submitDraft,
  submitEditedQuestion,
  submitNewQuestion,
} from "@/services/questionPortalHelpers";
import { CourseDialog } from "@/components/course-unit-selector";
import { FinalDialog } from "@/components/questionPortal/final-dialog";
import { notFound, useParams, useRouter } from "next/navigation";
import { getCourseData, getUnitForCourse } from "@/services/courseUnitData";
import { cacheCoursesAndUnits } from "@/services/cacheServices";
import { classifyQuestion } from "@/utils/classify";

export default function QuestionPortal() {
  const [id, setId] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [origionalHints, setOrigionalHints] = useState<Hint[]>([]);
  const [editingHint, setEditingHint] = useState<Hint | null>(null);
  const [origionalCourse, setOrigionalCourse] = useState<string>("");
  const [oritionalUnit, setOrigionalUnit] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [showAdditionalInfoDialog, setShowAdditionalInfoDialog] =
    useState(false);
  const [questionType, setQuestionType] = useState<"draft" | "publish" | null>(
    null
  );
  const [error, setError] = useState(false);
  const [final, setFinal] = useState(false);
  const { user } = useAuth();
  const params = useParams();
  const idParam = params?.id;
  const router = useRouter();

  useEffect(() => {
    if (Array.isArray(idParam) && idParam.length === 2) {
      const [type, questionId] = idParam;
      if (
        (type === "draft" || type === "publish") &&
        typeof questionId === "string"
      ) {
        setQuestionType(type);
        setId(questionId);
      }
    } else if (typeof idParam === "string") {
      setId(idParam);
    }
  }, [idParam]);

  useEffect(() => {
    const handleEditing = async () => {
      if (!id || typeof id !== "string") return;

      try {
        const isDraft = questionType === "draft";
        const questionData = await getQuestionDataWithId(id, isDraft);
        if (!questionData) throw new Error("No question data");

        const questionCourse = questionData.course;
        const questionUnit = questionData.unit;

        let course: Course | null = null;
        try {
          course = await getCourseData(questionCourse);
        } catch (err) {
          console.error("Error loading course:", err);
          router.push("/questionPortal");
          return;
        }

        if (!course || course.creator !== user?.uid) {
          console.error("Error with creator:");
          router.push("/questionPortal");
          return;
        }

        const unit = await getUnitForCourse(questionCourse, questionUnit);
        if (!unit) throw new Error("No unit found");

        setAnswers(questionData.answers || []);
        setHints(questionData.hints || []);
        setOrigionalHints(questionData.hints || []);
        setQuestion(questionData.question || "");
        setOrigionalCourse(questionCourse || "");
        setOrigionalUnit(questionUnit || "");
        setSelectedCourse(course || null);
        setSelectedUnit(unit);
      } catch (error) {
        console.error("handleEditing failed:", error);
        setError(true);
      }
    };
    handleEditing();
  }, [id, questionType, router, user]);

  useEffect(() => {
    cacheCoursesAndUnits(user?.uid as string);
  }, [user?.uid, id]);

  const handleHintSubmit = (hint: Hint) => {
    setHints((prev) => {
      const index = prev.findIndex((h) => h.key === hint.key);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = hint;
        return updated;
      }
      return [...prev, hint];
    });
    setEditingHint(null);
  };

  const addAnswer = () => {
    setAnswers((prev) => [
      ...prev,
      {
        key: uuidv4(),
        content: "",
        answer: false,
      },
    ]);
  };

  const updateContent = (key: string, newContent: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.key === key ? { ...ans, content: newContent } : ans
      )
    );
  };

  const toggleCorrect = (key: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.key === key ? { ...ans, answer: !ans.answer } : ans
      )
    );
  };

  const deleteAnswer = (key: string) => {
    setAnswers((prev) => prev.filter((ans) => ans.key !== key));
  };

  const deleteHint = (key: string) => {
    setHints((prev) => prev.filter((hint) => hint.key !== key));
  };

  const handleUnitSelect = (course: Course, unit: Unit | null) => {
    if (!unit) return;
    setSelectedCourse(course);
    setSelectedUnit(unit);
  };

  const handleSubmit = async () => {
    const hasCorrectAnswer = answers.some((answer) => answer.answer);
    if (!question.trim() || answers.length < 2 || !hasCorrectAnswer) return;
    let status: "error" | { status: "success"; id: string } = "error";
    if (selectedCourse && selectedUnit) {
      if (id === "") {
        const fullHints = await convertHintsForUpload(hints);
        status = await submitNewQuestion({
          question: question.trim(),
          hints: fullHints,
          answers,
          course: selectedCourse.key,
          unit: selectedUnit.key,
          id: "",
        });
      } else {
        const editingQuestion: EditingQuestion = {
          id,
          question: question.trim(),
          hints: hints,
          oldHints: origionalHints,
          answers,
          course: selectedCourse.key,
          unit: selectedUnit.key,
          oldCourse: origionalCourse,
          oldUnit: oritionalUnit,
        };
        status = await submitEditedQuestion(editingQuestion);
      }

      if (status === "error") {
        alert(
          "There was an error! Most likley, you are editing an invalid question."
        );
      } else {
        const tags = await classifyQuestion(status.id);
        if ("tags" in tags && tags.tags.length > 0) {
          addTagsToQuestion(status.id, tags.tags);
          setFinal(true);
        } else {
          alert(
            "Your question was saved, but there wasn an error! Save it again."
          );
        }
      }
    }
  };

  const handleNewDraft = async () => {
    const fullHints = await convertHintsForUpload(hints);
    if (selectedCourse && selectedUnit) {
      setQuestionType("draft");
      const status = await submitDraft({
        question: question.trim(),
        hints: fullHints,
        answers,
        course: selectedCourse.key,
        unit: selectedUnit.key,
        id: "",
      });
      if (status === "error") {
        alert(
          "There was an error! Most likley, you did not select a course and unit."
        );
      }
      if (status === "success") {
        setFinal(true);
      }
    }
  };

  const handleEditingDraft = async () => {
    const fullHints = await handleHintImages(hints, origionalHints);
    if (selectedCourse && selectedUnit) {
      setQuestionType("draft");
      const status = await editDraft({
        id,
        question: question.trim(),
        hints: fullHints,
        answers,
        course: selectedCourse.key,
        unit: selectedUnit.key,
        oldCourse: origionalCourse,
        oldUnit: oritionalUnit,
      });
      if (status === "error") {
        alert(
          "There was an error! Most likley, you did not select a course and unit."
        );
      }
      if (status === "success") {
        setFinal(true);
      }
    }
  };

  const fromDraftToPublish = async () => {
    if (selectedCourse && selectedUnit) {
      alert("Save all changes as a draft before proceeding.");
      const confirmed = window.confirm("Do you want to proceed?");
      if (!confirmed) return;
      await draftToPublish(id, selectedCourse.key, selectedUnit.key);
      const tags = await classifyQuestion(id);
      if ("tags" in tags && tags.tags.length > 0) {
        addTagsToQuestion(id, tags.tags);
        router.push(`/questionPortal/publish/${id}`);
      } else {
        alert(
          "Your question was saved, but there wasn an error! Save it again."
        );
      }
    }
  };

  const fromPublishToDraft = async () => {
    if (selectedCourse && selectedUnit) {
      alert("Publish all changes before proceeding.");
      const confirmed = window.confirm("Do you want to proceed?");
      if (!confirmed) return;
      publishToDraft(id, selectedCourse.key, selectedUnit.key);
      router.push(`/questionPortal/draft/${id}`);
    }
  };

  if (error) {
    notFound();
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
      <SidebarInset className="p-6 space-y-4 bg-zinc-950 min-h-screen">
        <div
          className={
            "inline-block px-3 py-1 rounded-md text-sm font-medium bg-zinc-800 text-zinc-300"
          }
        >
          {questionType === "publish"
            ? "Published"
            : questionType === "draft"
            ? "Draft"
            : "Unsaved"}
        </div>

        <div className="bg-zinc-900 rounded-2xl shadow-md p-4">
          <h1 className="text-xl font-semibold text-white mb-2">Question</h1>
          <Input
            className="bg-zinc-800 text-white placeholder-zinc-400 border-zinc-700"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type something..."
          />
        </div>

        <div className="bg-zinc-900 rounded-2xl shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Course & Unit</h1>
          <IconPencil
            className="w-10 h-10 text-white cursor-pointer"
            onClick={() => setCourseOpen(true)}
          />
          <CourseDialog
            open={courseOpen}
            onOpenChange={setCourseOpen}
            onUnitSelect={handleUnitSelect}
            type={"channel"}
            cache={true}
          />
        </div>

        {selectedCourse && selectedUnit && (
          <div className="flex items-center gap-4 bg-zinc-900 p-3 rounded-md border border-zinc-700">
            <div>
              <p className="text-lg font-semibold text-white">
                {selectedCourse.name}
              </p>
              <p className="text-sm text-zinc-400">{selectedUnit.name}</p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Additional Info</h1>
          <IconPlus
            className="w-10 h-10 text-white cursor-pointer"
            onClick={() => setShowAdditionalInfoDialog(true)}
          />
        </div>

        {hints.map((hint) => (
          <div
            key={hint.key}
            className="bg-zinc-900 text-white rounded-xl shadow-md p-4 relative space-y-3"
          >
            <button
              onClick={() => {
                setShowAdditionalInfoDialog(true);
                setEditingHint(hint);
              }}
              className="absolute top-2 right-10 p-1 text-blue-400 hover:text-blue-200"
              title="Edit Hint"
            >
              <IconPencil />
            </button>

            <button
              onClick={() => deleteHint(hint.key)}
              className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-200"
              title="Delete Hint"
            >
              <IconTrash />
            </button>

            {hint.title && (
              <h2 className="text-lg font-semibold">{hint.title}</h2>
            )}

            {hint.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  typeof hint.image === "string"
                    ? hint.image
                    : URL.createObjectURL(hint.image)
                }
                alt={hint.title || "Hint Image"}
                className="w-full max-h-64 object-contain rounded-md border border-zinc-700"
              />
            )}
            {hint.content && (
              <p className="text-sm text-zinc-300">{hint.content}</p>
            )}
          </div>
        ))}

        <AdditionalInfoDialog
          open={showAdditionalInfoDialog}
          onOpenChange={(val) => {
            setShowAdditionalInfoDialog(val);
            if (!val) setEditingHint(null);
          }}
          onSubmit={handleHintSubmit}
          initialData={editingHint}
        />

        <div className="bg-zinc-900 rounded-2xl shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Answer Choices</h1>
          <IconPlus
            className="w-10 h-10 text-white cursor-pointer"
            onClick={addAnswer}
          />
        </div>

        {answers.map((ans, index) => (
          <div
            key={ans.key}
            className="bg-zinc-900 rounded-xl p-4 shadow-sm flex items-center justify-between space-x-4"
          >
            <Input
              className="bg-zinc-900 text-white placeholder-zinc-400 border-zinc-600 flex-1"
              placeholder={`Answer Choice ${index + 1}`}
              value={ans.content}
              onChange={(e) => updateContent(ans.key, e.target.value)}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => toggleCorrect(ans.key)}
                className={`p-2 rounded-lg ${
                  ans.answer
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-zinc-600 hover:bg-zinc-500"
                }`}
                title={ans.answer ? "Correct Answer" : "Mark as Correct"}
              >
                <IconCheck className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => deleteAnswer(ans.key)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                title="Delete Answer"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
        <FinalDialog open={final} onOpenChange={setFinal} />
        {questionType === null && (
          <div
            className="mt-10 flex justify-center gap-4"
            onClick={handleNewDraft}
          >
            <button className="bg-zinc-100 text-black px-6 py-2 rounded-md shadow border border-gray-300 hover:bg-zinc-200 transition">
              Save as Draft
            </button>

            <button
              onClick={handleSubmit}
              className="bg-black text-white px-6 py-2 rounded-md shadow hover:bg-gray-800 transition"
            >
              Publish
            </button>
          </div>
        )}
        {questionType === "draft" && (
          <div
            className="mt-10 flex justify-center gap-4"
            onClick={handleEditingDraft}
          >
            <button className="bg-zinc-100 text-black px-6 py-2 rounded-md shadow border border-gray-300 hover:bg-zinc-200 transition">
              Save changes as Draft
            </button>

            <button
              onClick={fromDraftToPublish}
              className="bg-black text-white px-6 py-2 rounded-md shadow hover:bg-gray-800 transition"
            >
              Publish
            </button>
          </div>
        )}
        {questionType === "publish" && (
          <div
            className="mt-10 flex justify-center gap-4"
            onClick={fromPublishToDraft}
          >
            <button className="bg-zinc-100 text-black px-6 py-2 rounded-md shadow border border-gray-300 hover:bg-zinc-200 transition">
              Convert to Draft
            </button>

            <button
              onClick={handleSubmit}
              className="bg-black text-white px-6 py-2 rounded-md shadow hover:bg-gray-800 transition"
            >
              Publish Changes
            </button>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
