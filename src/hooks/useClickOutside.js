import { useEffect, useRef as useReactRef } from 'react';

export const useClickOutside = (ref, isActive, onClose) => {
  const onCloseRef = useReactRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isActive) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onCloseRef.current();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, isActive]);
};
