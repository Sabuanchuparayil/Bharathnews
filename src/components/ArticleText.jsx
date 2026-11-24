import React from 'react';

/** Turn **sentence** markers into bold text. The stars are not shown. */
export default function ArticleText({ text }) {
  const source = String(text || '');
  const nodes = [];
  const pattern = /\*\*([^*\n]+?)\*\*/g;
  let cursor = 0;
  let match = pattern.exec(source);
  let index = 0;
  while (match) {
    if (match.index > cursor) nodes.push(source.slice(cursor, match.index));
    nodes.push(<strong key={`bold-${index}`} className="font-semibold">{match[1]}</strong>);
    index += 1;
    cursor = match.index + match[0].length;
    match = pattern.exec(source);
  }
  if (cursor < source.length) nodes.push(source.slice(cursor));
  return nodes;
}
