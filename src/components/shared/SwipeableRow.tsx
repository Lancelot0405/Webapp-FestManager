import { useRef, type ReactNode } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

export interface SwipeAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  /** classes nền + chữ cho nút (vd. 'bg-danger text-white') */
  className?: string;
}

interface Props {
  children: ReactNode;
  actions: SwipeAction[];
  /** Bề rộng mỗi nút (px) */
  actionWidth?: number;
  className?: string;
}

export default function SwipeableRow({ children, actions, actionWidth = 72, className }: Props) {
  const controls = useAnimationControls();
  const openRef = useRef(false);
  const total = actions.length * actionWidth;

  const setOpenState = (next: boolean) => {
    openRef.current = next;
    controls.start({ x: next ? -total : 0 });
  };

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            aria-label={action.label}
            style={{ width: actionWidth }}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold ${action.className ?? 'bg-foreground/10 text-foreground'}`}
            onClick={() => {
              setOpenState(false);
              action.onClick();
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -total, right: 0 }}
        dragElastic={0.06}
        animate={controls}
        onDragEnd={(_, info) => {
          const shouldOpen = info.offset.x < -total / 2 || info.velocity.x < -400;
          setOpenState(shouldOpen);
        }}
        onClickCapture={(e) => {
          if (openRef.current) {
            e.preventDefault();
            e.stopPropagation();
            setOpenState(false);
          }
        }}
        className="relative bg-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}
