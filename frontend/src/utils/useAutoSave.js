// src/hooks/useAutoSave.js
import { useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';

const useAutoSave = (key, data, delay = 3000, enabled = true) => {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  const saveToLocalStorage = useCallback(() => {
    if (!enabled || !data) return;

    // Avoid unnecessary saves if data hasn't changed
    const currentDataStr = JSON.stringify(data);
    if (currentDataStr === lastSavedRef.current) return;

    try {
      localStorage.setItem(key, currentDataStr);
      lastSavedRef.current = currentDataStr;

      // Optional: show subtle message (can be turned off in production)
      // message.success('Draft saved', 1);
    } catch (err) {
      console.warn('AutoSave failed:', err);
    }
  }, [key, data, enabled]);

  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(saveToLocalStorage, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveToLocalStorage, delay, enabled]);

  // Manual save function
  const forceSave = useCallback(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  // Load saved draft
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.warn('Failed to load draft:', err);
      return null;
    }
  }, [key]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    lastSavedRef.current = null;
  }, [key]);

  return { forceSave, loadDraft, clearDraft };
};

export default useAutoSave;