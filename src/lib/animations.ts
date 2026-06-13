export const animations = {
  pageEnter: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  drawerSlide: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  listItem: (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.04, duration: 0.2 },
  }),
  press: { whileTap: { scale: 0.97 } },
} as const;
