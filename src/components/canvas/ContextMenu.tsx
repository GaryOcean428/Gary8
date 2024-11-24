import { useEffect, useRef } from 'react';
import {
  Copy,
  Trash,
  Send,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoveHorizontal,
  ArrowUpDown,
  Layers
} from 'lucide-react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  selectedElements: string[];
}

export function ContextMenu({
  x,
  y,
  onClose,
  onAction,
  selectedElements
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.style.setProperty('--menu-x', `${x}px`);
      menuRef.current.style.setProperty('--menu-y', `${y}px`);
    }
  }, [x, y]);

  const hasSelection = selectedElements.length > 0;
  const hasMultipleSelection = selectedElements.length > 1;

  const getPositionClasses = () => {
    const rightOverflow = x + 160 > window.innerWidth;
    const bottomOverflow = y + 200 > window.innerHeight;
    
    if (rightOverflow && bottomOverflow) return styles.rightBottomAligned;
    if (rightOverflow) return styles.rightAligned;
    if (bottomOverflow) return styles.bottomAligned;
    return '';
  };

  return (
    <div
      ref={menuRef}
      className={`${styles.contextMenu} ${styles.positionedMenu} ${getPositionClasses()}`}
      role="menubar"
      aria-orientation="vertical"
      tabIndex={-1}
    >
      <button
        className={`${styles.menuItem} ${!hasSelection ? styles.disabled : ''}`}
        onClick={() => hasSelection && onAction('copy')}
        disabled={!hasSelection}
        role="menuitem"
        tabIndex={!hasSelection ? -1 : 0}
      >
        <Copy className="w-4 h-4" aria-hidden="true" />
        <span>Copy</span>
      </button>
      
      <button
        className={`${styles.menuItem} ${!hasSelection ? styles.disabled : ''}`}
        onClick={() => hasSelection && onAction('delete')}
        disabled={!hasSelection}
        role="menuitem"
        tabIndex={!hasSelection ? -1 : 0}
      >
        <Trash className="w-4 h-4" aria-hidden="true" />
        <span>Delete</span>
      </button>

      <div className={styles.divider} role="separator" aria-orientation="horizontal" />

      <button
        className={`${styles.menuItem} ${!hasSelection ? styles.disabled : ''}`}
        onClick={() => hasSelection && onAction('lock')}
        disabled={!hasSelection}
        role="menuitem"
        tabIndex={!hasSelection ? -1 : 0}
      >
        <Lock className="w-4 h-4" aria-hidden="true" />
        <span>Lock</span>
      </button>

      <button
        className={`${styles.menuItem} ${!hasSelection ? styles.disabled : ''}`}
        onClick={() => hasSelection && onAction('unlock')}
        disabled={!hasSelection}
        role="menuitem"
        tabIndex={!hasSelection ? -1 : 0}
      >
        <Unlock className="w-4 h-4" aria-hidden="true" />
        <span>Unlock</span>
      </button>

      <div className={styles.divider} role="separator" aria-orientation="horizontal" />
      <div className={styles.sectionTitle} role="presentation">Align</div>

      <button
        className={`${styles.menuItem} ${!hasMultipleSelection ? styles.disabled : ''}`}
        onClick={() => hasMultipleSelection && onAction('align-left')}
        disabled={!hasMultipleSelection}
        role="menuitem"
        tabIndex={!hasMultipleSelection ? -1 : 0}
      >
        <AlignLeft className="w-4 h-4" aria-hidden="true" />
        <span>Align Left</span>
      </button>

      <button
        className={`${styles.menuItem} ${!hasMultipleSelection ? styles.disabled : ''}`}
        onClick={() => hasMultipleSelection && onAction('align-center')}
        disabled={!hasMultipleSelection}
        role="menuitem"
        tabIndex={!hasMultipleSelection ? -1 : 0}
      >
        <AlignCenter className="w-4 h-4" aria-hidden="true" />
        <span>Align Center</span>
      </button>

      <button
        className={`${styles.menuItem} ${!hasMultipleSelection ? styles.disabled : ''}`}
        onClick={() => hasMultipleSelection && onAction('align-right')}
        disabled={!hasMultipleSelection}
        role="menuitem"
        tabIndex={!hasMultipleSelection ? -1 : 0}
      >
        <AlignRight className="w-4 h-4" aria-hidden="true" />
        <span>Align Right</span>
      </button>

      <div className={styles.divider} role="separator" aria-orientation="horizontal" />
      <div className={styles.sectionTitle} role="presentation">Distribute</div>

      <button
        className={`${styles.menuItem} ${!hasMultipleSelection ? styles.disabled : ''}`}
        onClick={() => hasMultipleSelection && onAction('distribute-h')}
        disabled={!hasMultipleSelection}
        role="menuitem"
        tabIndex={!hasMultipleSelection ? -1 : 0}
      >
        <MoveHorizontal className="w-4 h-4" aria-hidden="true" />
        <span>Distribute Horizontally</span>
      </button>

      <button
        className={`${styles.menuItem} ${!hasMultipleSelection ? styles.disabled : ''}`}
        onClick={() => hasMultipleSelection && onAction('distribute-v')}
        disabled={!hasMultipleSelection}
        role="menuitem"
        tabIndex={!hasMultipleSelection ? -1 : 0}
      >
        <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
        <span>Distribute Vertically</span>
      </button>

      <div className={styles.divider} role="separator" aria-orientation="horizontal" />

      <button
        className={`${styles.menuItem} ${!hasSelection ? styles.disabled : ''}`}
        onClick={() => hasSelection && onAction('bring-front')}
        disabled={!hasSelection}
        role="menuitem"
        tabIndex={!hasSelection ? -1 : 0}
      >
        <Layers className="w-4 h-4" aria-hidden="true" />
        <span>Bring to Front</span>
      </button>

      <button
        className={`${styles.menuItem} ${!hasSelection ? styles.disabled : ''}`}
        onClick={() => hasSelection && onAction('send-back')}
        disabled={!hasSelection}
        role="menuitem"
        tabIndex={!hasSelection ? -1 : 0}
      >
        <Layers className="w-4 h-4" aria-hidden="true" />
        <span>Send to Back</span>
      </button>
    </div>
  );
}
