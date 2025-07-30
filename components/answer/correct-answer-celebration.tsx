"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use"; 

export function CorrectAnswerCelebration({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize(); 

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const removeTimer = setTimeout(() => setShowConfetti(false), 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="relative z-10">
      {showConfetti && (
        <div
          className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-1000 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <Confetti
            width={width}
            height={height}
            numberOfPieces={200}
            recycle={false}
            gravity={0.4} 
          />
        </div>
      )}
      {children}
    </div>
  );
}