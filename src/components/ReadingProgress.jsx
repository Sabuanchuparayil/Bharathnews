import React, { useState, useEffect } from 'react';

const ReadingProgress = ({ readTimeMinutes = 5 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  const minutesRead = Math.max(1, Math.min(readTimeMinutes, Math.ceil((progress / 100) * readTimeMinutes)));

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      {progress > 8 && (
        <div
          className="fixed top-2 right-4 z-[100] text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-dark-surface-1/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm"
          aria-live="polite"
        >
          {minutesRead} of {readTimeMinutes} min read
        </div>
      )}
    </>
  );
};

export default ReadingProgress;
