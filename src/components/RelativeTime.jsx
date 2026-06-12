'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000);
  }
  return new Date(value);
}

/** Client-only relative time — avoids SSR/client text mismatch (React #418). */
export default function RelativeTime({ date, className, fallback = '' }) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    const d = toDate(date);
    if (!d || Number.isNaN(d.getTime())) {
      setText(fallback);
      return;
    }
    setText(formatDistanceToNow(d, { addSuffix: true }));
  }, [date, fallback]);

  if (!date && !fallback) return null;

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
