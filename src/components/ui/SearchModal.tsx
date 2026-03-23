'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  title: string;
  subtitle?: string;
  placeholder: string;
  icon: React.ReactNode;
  accentColor: string;
  helpTitle: string;
  helpItems: string[];
  isLoading?: boolean;
}

export function SearchModal({
  isOpen,
  onClose,
  onSearch,
  title,
  subtitle,
  placeholder,
  icon,
  accentColor,
  helpTitle,
  helpItems,
  isLoading = false,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed && !isLoading) {
        onSearch(trimmed);
      }
    },
    [query, isLoading, onSearch]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="search-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="search-modal" style={{ '--search-accent': accentColor } as React.CSSProperties}>
        {/* Header */}
        <div className="search-modal-header">
          <div className="search-modal-title-row">
            <div className="search-modal-icon" style={{ background: `${accentColor}20` }}>
              {icon}
            </div>
            <div>
              <h2 className="search-modal-title">{title}</h2>
              <p className="search-modal-subtitle">{subtitle || 'Enter a username to view their profile'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="search-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="search-modal-form">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="search-modal-input"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
        </form>

        {/* Help Section */}
        <div className="search-modal-help">
          <div className="search-modal-help-header">
            <AlertCircle size={14} style={{ color: accentColor }} />
            <span style={{ color: accentColor }}>{helpTitle}</span>
          </div>
          <ul className="search-modal-help-list">
            {helpItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="search-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="search-modal-btn-cancel"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="search-modal-btn-search"
            style={{
              background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
              borderColor: `${accentColor}50`,
              color: accentColor,
            }}
            disabled={!query.trim() || isLoading}
          >
            <Search size={14} />
            {isLoading ? 'Searching...' : 'Search Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Search button component to trigger the modal
 */
interface SearchButtonProps {
  onClick: () => void;
  accentColor: string;
  label?: string;
}

export function SearchButton({ onClick, accentColor, label = 'Search Profile' }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className="search-trigger-btn"
      style={{
        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
        borderColor: `${accentColor}30`,
        color: accentColor,
      }}
    >
      <Search size={14} />
      {label}
    </button>
  );
}
