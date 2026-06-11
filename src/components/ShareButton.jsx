import React, { useState, useRef } from 'react';
import { Share2, Link2, MessageCircle, Smartphone } from 'lucide-react';
import { toast } from 'react-toastify';
import { useClickOutside } from '../hooks/useClickOutside';
import {
  buildShareUrl, getSocialShareUrls, shareNative, copyShareUrl, openShareWindow,
} from '../utils/share';

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', color: 'text-green-600' },
  { id: 'twitter', label: 'X / Twitter', color: 'text-gray-900 dark:text-white' },
  { id: 'facebook', label: 'Facebook', color: 'text-blue-600' },
  { id: 'telegram', label: 'Telegram', color: 'text-sky-500' },
  { id: 'linkedin', label: 'LinkedIn', color: 'text-blue-700' },
];

const ShareButton = ({
  title,
  text = '',
  path,
  url: urlProp,
  contentType = 'content',
  showLabel = false,
  size = 'md',
  className = '',
  onShared,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  useClickOutside(menuRef, open, () => setOpen(false));

  const shareUrl = urlProp || buildShareUrl(path, contentType);
  const socialUrls = getSocialShareUrls({ title, text, url: shareUrl });

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const btnPadding = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';

  const handleNativeShare = async (e) => {
    e.stopPropagation();
    const result = await shareNative({ title, text, url: shareUrl });
    if (result === true) {
      toast.success('Shared!');
      onShared?.('native');
    }
    setOpen(false);
  };

  const handleCopy = async (e) => {
    e?.stopPropagation?.();
    await copyShareUrl(shareUrl);
    toast.success('Link copied!');
    onShared?.('clipboard');
    setOpen(false);
  };

  const handlePlatform = (e, platform) => {
    e.stopPropagation();
    openShareWindow(socialUrls[platform]);
    onShared?.(platform);
    setOpen(false);
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  return (
    <div ref={menuRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggleMenu}
        aria-label="Share"
        aria-expanded={open}
        className={`${btnPadding} rounded-xl text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors flex items-center gap-1.5`}
      >
        <Share2 className={iconSize} />
        {showLabel && <span className="text-sm font-medium">Share</span>}
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-dark-surface-1 rounded-xl shadow-glass border border-gray-200 dark:border-gray-700 py-1 z-50"
          onClick={e => e.stopPropagation()}
        >
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-brand-600" /> Share via device
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
          >
            <Link2 className="w-4 h-4" /> Copy link
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={e => handlePlatform(e, p.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
            >
              <MessageCircle className={`w-4 h-4 ${p.color}`} />
              <span className="text-gray-700 dark:text-gray-300">{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShareButton;
