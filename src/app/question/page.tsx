/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import styles from "./page.module.css";
import {
  FaRegTrashAlt,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { Answer, Hint } from "@/utils/interfaces";
import { getUnits, getUserCourseList } from "@/sevices/getUserData";
import { useAuth } from "@/hooks/authContext";
import CourseCardShort from "@/components/CourseCardShort";
import UnitCard from "@/components/UnitCard";
import { uploadImageToFirebase } from "@/sevices/handleImages";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast, ToastContainer } from "react-toastify";

const CreateQuestion = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);

  const [question, setQuestion] = useState("");

  const [hints, setHints] = useState<Hint[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintTitle, setHintTitle] = useState("");
  const [hintContent, setHintContent] = useState("");
  const [hintImage, setHintImage] = useState<string>("");
  const [editingHintKey, setEditingHintKey] = useState<string | null>(null);

  const [courseModalView, setCourseModalView] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [courses, setCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const [units, setUnits] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const { user } = useAuth();
  const error = () => toast("Information missing");
  const success = () => toast("Success!");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseList = await getUserCourseList(user?.uid as string);
        setCourses(courseList);
      } catch (error) {
        console.error("Error fetching courses: ", error);
      }
    };
    fetchCourses();
  }, [user?.uid]);

  useEffect(() => {
    setSelectedUnit(null);
    const fetchUnits = async () => {
      try {
        if (selectedCourse) {
          const unitsList = await getUnits(selectedCourse);
          setUnits(unitsList);
        }
      } catch (error) {
        console.error("Error fetchung units: ", error);
      }
    };
    fetchUnits();
  }, [selectedCourse]);

  const handleSubmit = async () => {
    const hasCorrectAnswer = answers.some((answer) => answer.answer);
    if (!question.trim() || answers.length < 2 || !hasCorrectAnswer) {
      error();
    }

    if (
      selectedCourse &&
      selectedUnit &&
      typeof selectedCourse === "string" &&
      typeof selectedUnit === "string"
    ) {
      hints.forEach(async (hint) => {
        if (hint.image) {
          const uri = await uploadImageToFirebase(hint.image, "questions");
          hint.image = uri;
        }
      });

      const questionData = {
        question: question,
        hints: hints,
        answers: answers,
        course: selectedCourse,
        unit: selectedUnit,
      };
      const docRef = await addDoc(collection(db, "questions"), questionData);
      const newQuestionId = docRef.id;

      const unitRef = doc(db, "courses", selectedCourse, "units", selectedUnit);
      await updateDoc(unitRef, {
        questions: arrayUnion(newQuestionId),
      });

      const courseRef = doc(db, "courses", selectedCourse);
      await updateDoc(courseRef, {
        numQuestions: increment(1),
      });
      success();
      setSelectedCourse(null);
      setSelectedUnit(null);
      setAnswers([]);
      setHints([]);
    }
  };

  const addAnswer = () => {
    setAnswers((prev) => [
      ...prev,
      { key: Date.now().toString(), content: "", answer: false },
    ]);
  };

  const updateAnswerContent = (key: string, newContent: string) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.key === key ? { ...answer, content: newContent } : answer
      )
    );
  };

  const toggleAnswer = (key: string) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.key === key ? { ...answer, answer: !answer.answer } : answer
      )
    );
  };

  const deleteAnswer = (key: string) => {
    setAnswers((prev) => prev.filter((answer) => answer.key !== key));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setHintImage(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  const addHint = () => {
    if (!hintTitle.trim() && !hintContent.trim() && !hintImage) return;

    if (editingHintKey) {
      setHints((prev) =>
        prev.map((hint) =>
          hint.key === editingHintKey
            ? {
                ...hint,
                title: hintTitle,
                content: hintContent,
                image: hintImage,
              }
            : hint
        )
      );
    } else {
      const newHint: Hint = {
        key: Date.now().toString(),
        title: hintTitle,
        content: hintContent,
        image: hintImage,
      };
      setHints((prev) => [...prev, newHint]);
    }

    setShowHintModal(false);
    setHintTitle("");
    setHintContent("");
    setHintImage("");
    setEditingHintKey(null);
  };

  const cancelHint = () => {
    setShowHintModal(false);
    setHintTitle("");
    setHintContent("");
    setHintImage("");
    setEditingHintKey(null);
  };

  const deleteHint = (key: string) => {
    setHints((prev) => prev.filter((hint) => hint.key !== key));
  };

  const selectCourseCard = (courseId: string) => {
    if (selectedCourse) {
      setSelectedCourse(null);
      setSelectedUnit(null);
    } else {
      setSelectedCourse(courseId);
    }
  };

  const selectUnitCard = (unitId: string) => {
    if (selectedUnit) {
      setSelectedUnit(null);
    } else {
      setSelectedUnit(unitId);
    }
  };

  const editHint = (passedHint: Hint) => {
    setEditingHintKey(passedHint.key);
    setHintTitle(passedHint.title);
    setHintContent(passedHint.content);
    setHintImage(passedHint.image || "");
    setShowHintModal(true);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Question</title>
      </Head>
      <h2 className={styles.title}>Create a question</h2>
      <textarea
        placeholder="Add Question Here"
        className={styles.input}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
      />

      <div className={styles.section}>
        <span>Course & Unit</span>
        <button
          className={styles.iconButton}
          onClick={() => setShowCourseModal(true)}
        >
          <FaEdit />
        </button>
      </div>
      {selectedCourse && <CourseCardShort id={selectedCourse} />}
      {selectedUnit && (
        <UnitCard
          id={selectedUnit as string}
          courseId={selectedCourse as string}
          selected={false}
          list={false}
        />
      )}

      <div className={styles.section}>
        <span>Additional Information</span>
        <button
          className={styles.iconButton}
          onClick={() => setShowHintModal(true)}
        >
          <FaPlus />
        </button>
      </div>

      {hints.length > 0 && (
        <div className={styles.hintContainer}>
          {hints.map((hint) => (
            <div key={hint.key} className={styles.hintCard}>
              <div className={styles.hintContent}>
                <h4 className={styles.hintTitle}>{hint.title}</h4>
                <div className={styles.hintImageContainer}>
                  {hint.image && (
                    <img
                      src={hint.image}
                      alt="Hint"
                      className={styles.hintImage}
                    />
                  )}
                </div>
                <p className={styles.hintDescription}>{hint.content}</p>
              </div>
              <div className={styles.hintButtonsVertical}>
                <button
                  className={styles.hintEditButton}
                  onClick={() => {
                    editHint(hint);
                  }}
                >
                  <FaEdit size={16} />
                </button>

                <button
                  className={styles.hintDeleteButton}
                  onClick={() => deleteHint(hint.key)}
                >
                  <FaRegTrashAlt size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <span>Answer Choices</span>
        <button className={styles.iconButton} onClick={addAnswer}>
          <FaPlus />
        </button>
      </div>

      {answers.map((answer) => (
        <div
          key={answer.key}
          className={`${styles.answerContainer} ${
            answer.answer ? styles.correct : styles.incorrect
          }`}
        >
          <input
            type="text"
            placeholder="Answer content"
            value={answer.content}
            onChange={(e) => updateAnswerContent(answer.key, e.target.value)}
            className={styles.answerInput}
          />
          <div className={styles.answerActions}>
            <button
              className={styles.iconButton}
              onClick={() => toggleAnswer(answer.key)}
            >
              <FaCheck color={answer.answer ? "#28a745" : "#888"} />
            </button>
            <button
              className={styles.iconButton}
              onClick={() => deleteAnswer(answer.key)}
            >
              <FaRegTrashAlt color="#dc3545" />
            </button>
          </div>
        </div>
      ))}

      <button className={styles.submitButton} onClick={handleSubmit}>
        Submit
      </button>
      {showHintModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <h3 className={styles.modalTitle}>Add Additional Information</h3>

            <input
              type="text"
              placeholder="Title"
              className={styles.modalHintInputContent}
              value={hintTitle}
              onChange={(e) => setHintTitle(e.target.value)}
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
            />

            <textarea
              placeholder="Description"
              className={styles.modalHintInputContent}
              value={hintContent}
              onChange={(e) => setHintContent(e.target.value)}
              rows={5}
            />

            {hintImage && (
              <div className={styles.imageContainer}>
                <img src={hintImage} alt="Preview" className={styles.image} />
                <button
                  className={styles.removeImageBtn}
                  onClick={() => setHintImage("")}
                  type="button"
                  aria-label="Remove image"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <div className={styles.modalButtonContainer}>
              <button className={styles.cancelButton} onClick={cancelHint}>
                <FaTimes /> Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={addHint}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showCourseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            {courseModalView && (
              <>
                <h3 className={styles.modalTitle}>Select a Course</h3>
                <div>
                  {courses.map((course) => (
                    <CourseCardShort
                      key={course}
                      id={course}
                      selected={selectedCourse === course}
                      onPress={() => selectCourseCard(course)}
                    />
                  ))}
                </div>
              </>
            )}
            {!courseModalView && (
              <>
                <h3 className={styles.modalTitle}>Select a Unit</h3>
                <div>
                  {units.map((unit) => (
                    <UnitCard
                      key={unit}
                      id={unit}
                      courseId={selectedCourse as string}
                      selected={selectedUnit === unit}
                      onPress={() => selectUnitCard(unit)}
                      list={true}
                    />
                  ))}
                </div>
              </>
            )}
            <div className={styles.modalButtonContainer}>
              <button
                className={styles.submitButton}
                onClick={() => setCourseModalView(!courseModalView)}
              >
                Toggle
              </button>
              <button
                className={styles.toggleButton}
                onClick={() => setShowCourseModal(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default CreateQuestion;
