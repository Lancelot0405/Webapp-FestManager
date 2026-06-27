import { motion } from 'framer-motion';
import { animations } from '../../lib/animations';
import type { StaffRef } from '../../types';

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function MiniAvatarGroup({ members }: { members: StaffRef[] }) {
  if (members.length === 0) return <span className="text-xs text-foreground/40">–</span>;
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((m, i) => (
        <motion.div key={m.id} {...animations.listItem(i)} whileHover={{ scale: 1.2, zIndex: 10 }} transition={{ duration: 0.15 }}
          className="w-6 h-6 rounded-full bg-accent/10 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-bold text-accent">{initials(m.name)}</span>
        </motion.div>
      ))}
      {extra > 0 && (
        <motion.div {...animations.listItem(shown.length)}
          className="w-6 h-6 rounded-full bg-default/80 ring-2 ring-background flex items-center justify-center">
          <span className="text-[9px] font-semibold text-foreground/60">+{extra}</span>
        </motion.div>
      )}
    </div>
  );
}
