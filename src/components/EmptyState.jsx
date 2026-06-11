'use client';

import React from 'react';
import Link from 'next/link';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) => (
  <div className="glass-card-solid rounded-2xl p-8 sm:p-12 text-center w-full">
    {Icon && (
      <div className="w-14 h-14 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
      </div>
    )}
    <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">{description}</p>
    )}
    {actionLabel && actionTo && (
      <Link href={actionTo} className="btn-primary inline-flex">{actionLabel}</Link>
    )}
    {actionLabel && onAction && !actionTo && (
      <button onClick={onAction} className="btn-primary">{actionLabel}</button>
    )}
  </div>
);

export default EmptyState;
