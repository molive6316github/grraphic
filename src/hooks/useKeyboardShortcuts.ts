import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category?: string;
  preventDefault?: boolean;
}

export const mockupStudioShortcuts: KeyboardShortcut[] = [
  {
    key: 'z',
    ctrl: true,
    action: () => {},
    description: 'Undo',
    category: 'Edit',
    preventDefault: true
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: () => {},
    description: 'Redo',
    category: 'Edit',
    preventDefault: true
  },
  {
    key: 'y',
    ctrl: true,
    action: () => {},
    description: 'Redo (Alt)',
    category: 'Edit',
    preventDefault: true
  },
  {
    key: 'c',
    ctrl: true,
    action: () => {},
    description: 'Copy',
    category: 'Edit',
    preventDefault: true
  },
  {
    key: 'v',
    ctrl: true,
    action: () => {},
    description: 'Paste',
    category: 'Edit',
    preventDefault: true
  },
  {
    key: 'd',
    ctrl: true,
    action: () => {},
    description: 'Duplicate',
    category: 'Edit',
    preventDefault: true
  },
  {
    key: 'a',
    ctrl: true,
    action: () => {},
    description: 'Select All',
    category: 'Selection',
    preventDefault: true
  },
  {
    key: 'Delete',
    action: () => {},
    description: 'Delete Selected',
    category: 'Edit'
  },
  {
    key: 'Backspace',
    action: () => {},
    description: 'Delete Selected',
    category: 'Edit'
  },
  {
    key: 's',
    ctrl: true,
    action: () => {},
    description: 'Save Project',
    category: 'File',
    preventDefault: true
  },
  {
    key: 'e',
    ctrl: true,
    action: () => {},
    description: 'Export',
    category: 'File',
    preventDefault: true
  },
  {
    key: ' ',
    action: () => {},
    description: 'Play/Pause',
    category: 'Playback'
  },
  {
    key: 'ArrowLeft',
    action: () => {},
    description: 'Previous Frame',
    category: 'Playback'
  },
  {
    key: 'ArrowRight',
    action: () => {},
    description: 'Next Frame',
    category: 'Playback'
  },
  {
    key: 'Home',
    action: () => {},
    description: 'Go to Start',
    category: 'Playback'
  },
  {
    key: 'End',
    action: () => {},
    description: 'Go to End',
    category: 'Playback'
  },
  {
    key: 'g',
    action: () => {},
    description: 'Toggle Grid',
    category: 'View'
  },
  {
    key: 'r',
    action: () => {},
    description: 'Toggle Rulers',
    category: 'View'
  },
  {
    key: 'l',
    action: () => {},
    description: 'Toggle Layers Panel',
    category: 'View'
  },
  {
    key: '0',
    ctrl: true,
    action: () => {},
    description: 'Fit to Screen',
    category: 'View',
    preventDefault: true
  },
  {
    key: '=',
    ctrl: true,
    action: () => {},
    description: 'Zoom In',
    category: 'View',
    preventDefault: true
  },
  {
    key: '-',
    ctrl: true,
    action: () => {},
    description: 'Zoom Out',
    category: 'View',
    preventDefault: true
  },
  {
    key: 't',
    action: () => {},
    description: 'Text Tool',
    category: 'Tools'
  },
  {
    key: 'v',
    action: () => {},
    description: 'Select Tool',
    category: 'Tools'
  },
  {
    key: 'h',
    action: () => {},
    description: 'Hand Tool',
    category: 'Tools'
  },
  {
    key: 'k',
    ctrl: true,
    action: () => {},
    description: 'Command Palette',
    category: 'General',
    preventDefault: true
  },
  {
    key: '?',
    shift: true,
    action: () => {},
    description: 'Keyboard Shortcuts Help',
    category: 'General'
  }
];

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
      });

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault) {
          event.preventDefault();
        }
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return shortcuts;
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');

  const keyDisplay = shortcut.key === ' ' ? 'Space' : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);
  parts.push(keyDisplay);

  return parts.join(' + ');
}

export function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);
}
