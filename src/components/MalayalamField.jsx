'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { deskFetch } from '@/lib/desk-client';

const suggestionCache = new Map();
const CACHE_LIMIT = 200;

function cachedSuggestions(key) {
  const cached = suggestionCache.get(key);
  if (!cached) return null;
  suggestionCache.delete(key);
  suggestionCache.set(key, cached);
  return cached;
}

function rememberSuggestions(key, suggestions) {
  if (!suggestions.length) return;
  suggestionCache.delete(key);
  suggestionCache.set(key, suggestions);
  while (suggestionCache.size > CACHE_LIMIT) {
    const oldest = suggestionCache.keys().next().value;
    suggestionCache.delete(oldest);
  }
}

function latinToken(value, cursor) {
  const match = String(value || '').slice(0, cursor).match(/[A-Za-z]{2,}$/);
  if (!match) return null;
  const word = match[0];
  if (word.length <= 6 && word === word.toUpperCase()) return null;
  return { word, start: cursor - word.length, end: cursor };
}

async function malayalamSuggestions(text, signal) {
  const key = text.toLowerCase();
  const cached = cachedSuggestions(key);
  if (cached) return cached;
  const data = await deskFetch(`/api/desk/transliterate?text=${encodeURIComponent(key)}`, { signal });
  const suggestions = Array.isArray(data.suggestions)
    ? data.suggestions.filter(item => typeof item === 'string' && item.trim())
    : [];
  rememberSuggestions(key, suggestions);
  return suggestions;
}

export const MalayalamTypingSwitch = ({ checked, onChange }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      Type Malayalam with English letters
    </label>
    <p className="text-xs text-gray-500">
      Type njan and click ഞാൻ. Enter uses the word in a title. In the story, Enter starts a new line. Escape or Space keeps the English word. CAPITALS such as AED stay in English.
    </p>
  </div>
);

const MalayalamField = ({
  label,
  hint,
  value,
  onChange,
  transliterate = false,
  multiline = false,
  rows = 3,
  required = false,
  placeholder = '',
}) => {
  const id = useId();
  const fieldRef = useRef(null);
  const caretRef = useRef(null);
  const dismissedRef = useRef('');
  const requestRef = useRef(null);
  const [token, setToken] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlighted, setHighlighted] = useState(0);

  const refreshToken = (element) => {
    if (!transliterate || !element) {
      setToken('');
      return;
    }
    const cursor = element.selectionStart ?? element.value.length;
    const next = latinToken(element.value, cursor);
    setToken(next ? next.word.toLowerCase() : '');
  };

  useEffect(() => {
    if (!transliterate || token.length < 2 || dismissedRef.current === token) {
      setSuggestions([]);
      return undefined;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => {
      malayalamSuggestions(token, controller.signal).then(words => {
        if (controller.signal.aborted || dismissedRef.current === token) return;
        setSuggestions(words);
        setHighlighted(0);
      }).catch(err => {
        if (controller.signal.aborted || dismissedRef.current === token || err?.name === 'AbortError') return;
        setSuggestions([]);
      });
    }, 140);
    return () => {
      clearTimeout(timer);
      controller.abort();
      if (requestRef.current === controller) requestRef.current = null;
    };
  }, [token, transliterate]);

  useEffect(() => {
    const element = fieldRef.current;
    const pos = caretRef.current;
    if (!element || pos == null) return;
    caretRef.current = null;
    element.focus();
    element.setSelectionRange(pos, pos);
  }, [value]);

  const applySuggestion = (suggestion, trailing = '') => {
    const element = fieldRef.current;
    if (!element) return;
    const cursor = element.selectionStart ?? value.length;
    const current = latinToken(value, cursor);
    if (!current) return;
    const insert = `${suggestion}${trailing}`;
    caretRef.current = current.start + insert.length;
    dismissedRef.current = '';
    setToken('');
    setSuggestions([]);
    onChange(`${value.slice(0, current.start)}${insert}${value.slice(current.end)}`);
  };

  const onKeyDown = (event) => {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted(index => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted(index => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      dismissedRef.current = token;
      requestRef.current?.abort();
      setSuggestions([]);
      return;
    }
    if (event.key === 'Enter' && !multiline) {
      event.preventDefault();
      applySuggestion(suggestions[highlighted] || suggestions[0]);
    }
  };

  const fieldClass = `mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm ${transliterate ? 'font-malayalam text-base leading-7' : ''}`;
  const shared = {
    id,
    ref: fieldRef,
    required,
    value: value || '',
    placeholder,
    lang: transliterate ? 'ml' : undefined,
    className: fieldClass,
    onChange: (event) => {
      dismissedRef.current = '';
      onChange(event.target.value);
      refreshToken(event.target);
    },
    onSelect: (event) => refreshToken(event.target),
    onKeyDown,
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      )}
      {multiline ? <textarea {...shared} rows={rows} /> : <input {...shared} />}
      {hint && <span className="mt-1 block text-xs font-normal text-gray-500">{hint}</span>}
      {suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1" role="listbox" aria-label="Malayalam suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              onMouseDown={(event) => {
                event.preventDefault();
                applySuggestion(suggestion);
              }}
              className={`rounded-lg px-2 py-1 text-base font-malayalam ${index === highlighted ? 'bg-brand-600 text-white' : 'bg-stone-100 dark:bg-white/10'}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MalayalamField;
