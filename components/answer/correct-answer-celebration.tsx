"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function CorrectAnswerCelebration({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const removeTimer = setTimeout(() => setShowConfetti(false), 6000);

    return () => clearTimeout(removeTimer);
  }, []);

  return (
    <div className="relative z-10">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={width}
            height={height}
            numberOfPieces={20}
            recycle={false}
            gravity={0.3}
            initialVelocityY={-8}
            wind={0}
            confettiSource={{
              x: 0,
              y: height * 0.1,
              w: width,
              h: 50
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}