import { useEffect, useState, type PointerEvent, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { AUTH_SHAKE_EVENT } from './authEvents';

/**
 * Wraps the login / sign-up card with:
 *  - a 3D tilt that follows the mouse (mouse only: never on phones or touch screens)
 *  - light beams travelling around the card edge
 *  - a soft pulsing glow behind the card
 *  - a quick side-to-side shake when a form reports an error (see authEvents.ts)
 *
 * Every colour comes from the active theme (--color-forest), so it matches whichever
 * theme is selected. Only transform and opacity animate, so it stays smooth.
 * With "reduce motion" turned on the card is perfectly still.
 */

const TILT_SPRING = { stiffness: 170, damping: 20, mass: 0.6 };
const MAX_TILT_DEG = 8;
const TILT_RANGE_PX = 260;

/** true only for a real mouse/trackpad, and when the visitor has not asked for less motion. */
function useCanTilt(): boolean {
  const reduce = useReducedMotion();
  const [hasMouse, setHasMouse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = () => setHasMouse(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return !reduce && hasMouse;
}

type Side = 'top' | 'right' | 'bottom' | 'left';

const BEAMS: Record<Side, { className: string; gradient: string; path: Record<string, string[]>; delay: number }> = {
  top:    { className: 'left-0 top-0 h-[3px] w-1/2',    gradient: 'linear-gradient(90deg, transparent, var(--color-forest), transparent)',  path: { x: ['-100%', '200%'] }, delay: 0 },
  right:  { className: 'right-0 top-0 h-1/2 w-[3px]',   gradient: 'linear-gradient(180deg, transparent, var(--color-forest), transparent)', path: { y: ['-100%', '200%'] }, delay: 0.6 },
  bottom: { className: 'bottom-0 left-0 h-[3px] w-1/2', gradient: 'linear-gradient(90deg, transparent, var(--color-forest), transparent)',  path: { x: ['200%', '-100%'] }, delay: 1.2 },
  left:   { className: 'left-0 top-0 h-1/2 w-[3px]',    gradient: 'linear-gradient(180deg, transparent, var(--color-forest), transparent)', path: { y: ['200%', '-100%'] }, delay: 1.8 },
};

function Beam({ side }: { side: Side }) {
  const beam = BEAMS[side];
  const travel = Object.keys(beam.path)[0] as 'x' | 'y';
  const move = { duration: 2.5, ease: 'easeInOut' as const, repeat: Infinity, repeatDelay: 1, delay: beam.delay };
  const fade = { duration: 1.25, repeat: Infinity, repeatType: 'mirror' as const, delay: beam.delay };
  return (
    <motion.div
      className={`absolute ${beam.className}`}
      style={{ background: beam.gradient, filter: 'blur(1px)', willChange: 'transform, opacity' }}
      animate={{ ...beam.path, opacity: [0.25, 0.9, 0.25] }}
      transition={travel === 'x' ? { x: move, opacity: fade } : { y: move, opacity: fade }}
    />
  );
}

export function TiltCard({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const canTilt = useCanTilt();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-TILT_RANGE_PX, TILT_RANGE_PX], [MAX_TILT_DEG, -MAX_TILT_DEG]), TILT_SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-TILT_RANGE_PX, TILT_RANGE_PX], [-MAX_TILT_DEG, MAX_TILT_DEG]), TILT_SPRING);
  const shakeX = useMotionValue(0);

  // Shake when a form says something went wrong.
  useEffect(() => {
    if (reduce) return;
    const run = () => { void animate(shakeX, [0, -12, 11, -9, 7, -4, 2, 0], { duration: 0.5, ease: 'easeOut' }); };
    window.addEventListener(AUTH_SHAKE_EVENT, run);
    return () => window.removeEventListener(AUTH_SHAKE_EVENT, run);
  }, [reduce, shakeX]);

  // The outer box never rotates, so measuring the mouse against it stays stable.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!canTilt || e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - box.left - box.width / 2);
    mouseY.set(e.clientY - box.top - box.height / 2);
  };
  const onPointerLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <motion.div
      className="relative"
      style={{ perspective: 1200 }}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        className="relative group"
        style={canTilt ? { rotateX, rotateY, x: shakeX } : { x: shakeX }}
      >
        {/* Soft glow behind the card */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 rounded-[32px]"
          style={{ background: 'radial-gradient(55% 55% at 50% 50%, color-mix(in srgb, var(--color-forest) 30%, transparent), transparent 75%)' }}
          animate={reduce ? { opacity: 0.45 } : { opacity: [0.3, 0.6, 0.3] }}
          transition={reduce ? undefined : { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />

        {/* Light beams running around the edge (decoration only) */}
        {!reduce && (
          <div aria-hidden="true" className="pointer-events-none absolute -inset-px overflow-hidden" style={{ borderRadius: 17 }}>
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => <Beam key={side} side={side} />)}
          </div>
        )}

        <div className="relative">{children}</div>
      </motion.div>
    </motion.div>
  );
}
