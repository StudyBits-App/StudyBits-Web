"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/authContext";
import { IconThumbUp, IconThumbDown, IconPencil } from "@tabler/icons-react";
import {
  checkIfLikeOrDislike,
  checkIfSubscribed,
  getLikes,
  getDislikes,
  getViews,
  incrementLikes,
  incrementDislikes,
  removeLikeOrDislike,
  subscribeToCourse,
  unsubscribeFromCourse,
  getQuestionInfoById,
} from "@/services/answerHelpers";
import { Channel, QuestionInfo } from "@/utils/interfaces";
import { getChannelFromCourse } from "@/services/channelHelpers";
import { formatCount } from "@/utils/utils";

interface AnswerBottomBarProps {
  questionId: string;
  courseName: string;
  unitName: string;
  selectedCourseId: string;
}

export function AnswerBottomBar({
  questionId,
  courseName,
  unitName,
  selectedCourseId,
}: AnswerBottomBarProps) {
  const { user } = useAuth();

  const [questionInfo, setQuestionInfo] = useState<QuestionInfo | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  const fetchEngagementData = useCallback(
    async (courseId: string) => {
      if (!user?.uid) return;
      try {
        const [likeOrDislike, isSubscribed, likes, dislikes, views] =
          await Promise.all([
            checkIfLikeOrDislike(courseId, questionId, user.uid),
            checkIfSubscribed(courseId),
            getLikes(questionId),
            getDislikes(questionId),
            getViews(questionId),
          ]);

        setLiked(likeOrDislike === true);
        setDisliked(likeOrDislike === false);
        setSubscribed(isSubscribed);
        setLikeCount(likes);
        setDislikeCount(dislikes);
        setViewCount(views);
      } catch (err) {
        console.error("Error loading engagement data", err);
      }
    },
    [questionId, user?.uid]
  );

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const info = await getQuestionInfoById(questionId);
        if (!info) return;

        setQuestionInfo(info);
        const courseId = info.course;
        const channelData = await getChannelFromCourse(courseId);
        setChannel(channelData);
        fetchEngagementData(courseId);
      } catch (err) {
        console.error("Error loading question/channel info", err);
      }
    };

    if (questionId && user?.uid) {
      loadInfo();
    }
  }, [questionId, user?.uid, fetchEngagementData]);

  const handleLike = async () => {
    if (!user?.uid || !questionInfo) return;
    const courseId = questionInfo.course;

    try {
      if (liked) {
        await removeLikeOrDislike(courseId, user.uid, questionId, true);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        if (disliked) {
          await removeLikeOrDislike(courseId, user.uid, questionId, false);
          setDisliked(false);
          setDislikeCount((prev) => prev - 1);
        }
        await incrementLikes(courseId, user.uid, questionId);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error handling like", err);
    }
  };

  const handleDislike = async () => {
    if (!user?.uid || !questionInfo) return;
    const courseId = questionInfo.course;

    try {
      if (disliked) {
        await removeLikeOrDislike(courseId, user.uid, questionId, false);
        setDisliked(false);
        setDislikeCount((prev) => prev - 1);
      } else {
        if (liked) {
          await removeLikeOrDislike(courseId, user.uid, questionId, true);
          setLiked(false);
          setLikeCount((prev) => prev - 1);
        }
        await incrementDislikes(courseId, user.uid, questionId);
        setDisliked(true);
        setDislikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error handling dislike", err);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.uid || !questionInfo) return;
    const courseId = questionInfo.course;

    try {
      if (subscribed) {
        const mapStr = localStorage.getItem("subscriptions");
        if (mapStr) {
          const map = JSON.parse(mapStr) as Record<string, string>;
          const baseCourseId = map[courseId];
          await unsubscribeFromCourse(courseId, baseCourseId, user.uid);
          setSubscribed(false);
        }
      } else {
        await subscribeToCourse(courseId, selectedCourseId, user.uid);
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Error handling subscribe", err);
    }
  };

  if (!questionInfo) return null;

  return (
    <div className="w-full bg-zinc-900 border-t border-zinc-800 px-4 py-4 rounded-xl shadow flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-300">
      <div className="flex items-center gap-3 flex-wrap min-w-[180px]">
        {channel?.profilePicURL && (
          <Image
            src={channel.profilePicURL}
            alt="Channel Profile"
            width={36}
            height={36}
            className="rounded-full border border-zinc-700 object-cover"
          />
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-white font-medium">{channel?.displayName}</span>
          <span className="text-zinc-400">
            {" | "} {courseName} • {unitName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 min-w-[120px] justify-center">
        <button onClick={handleLike} className="flex items-center gap-1">
          <IconThumbUp
            size={30}
            className={liked ? "text-cyan-400" : "text-zinc-400"}
          />
          <span>{formatCount(likeCount)}</span>
        </button>
        <button onClick={handleDislike} className="flex items-center gap-1">
          <IconThumbDown
            size={30}
            className={disliked ? "text-red-400" : "text-zinc-400"}
          />
          <span>{formatCount(dislikeCount)}</span>
        </button>
      </div>

      <div className="min-w-[100px]">
        <Button
          className={`text-xs px-3 py-1 rounded-lg border ${
            subscribed
              ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}
          onClick={handleSubscribe}
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </Button>
      </div>
      
      <div className="flex items-center gap-1 text-zinc-400 min-w-[80px] justify-end">
        <IconPencil size={30} className="text-zinc-500" />
        <span>{formatCount(viewCount)}</span>
      </div>
    </div>
  );
}
