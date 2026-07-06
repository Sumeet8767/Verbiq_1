import { motion as Motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const GlassCard = ({
  children,
  className,
  delay = 0
}) => {
  return (
    <Motion.div
      initial={{
        opacity: 0,
        y: 25,
        scale: 0.96
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }}
      whileHover={{
        y: -6,
        scale: 1.01
      }}
      transition={{
        duration: 0.45,
        delay,
        ease: "easeOut"
      }}
      className={cn(
        `
        group
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/20
        bg-white/70
        backdrop-blur-2xl
        shadow-[0_20px_60px_rgba(15,23,42,0.12)]
        transition-all
        duration-500
        hover:border-red-300/40
        hover:shadow-[0_30px_80px_rgba(239,68,68,0.15)]
        `,
        className
      )}
    >
      {/* Glass Border */}

      <div className="absolute inset-0 rounded-[28px] border border-white/40 pointer-events-none" />

      {/* Animated Top Glow */}

      <div
        className="
        absolute
        -top-24
        left-1/2
        h-56
        w-56
        -translate-x-1/2
        rounded-full
        bg-red-500/10
        blur-3xl
        transition-all
        duration-700
        group-hover:bg-red-500/20
      "
      />

      {/* Bottom Accent */}

      <div
        className="
        absolute
        -bottom-28
        right-0
        h-64
        w-64
        rounded-full
        bg-cyan-400/10
        blur-3xl
      "
      />

      {/* Shine Effect */}

      <div
        className="
        absolute
        -left-40
        top-0
        h-full
        w-24
        rotate-12
        bg-white/30
        blur-xl
        transition-all
        duration-1000
        group-hover:left-[130%]
      "
      />

      {/* Content */}

      <div className="relative z-10 p-8">
        {children}
      </div>
    </Motion.div>
  );
};