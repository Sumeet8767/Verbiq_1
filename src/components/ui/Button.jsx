import { motion as Motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const Button = ({
  children,
  className,
  variant = "primary",
  isLoading,
  disabled,
  ...props
}) => {
  const variants = {
    primary:
      "relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white border border-red-400/30 shadow-[0_10px_35px_rgba(239,68,68,0.35)] hover:shadow-[0_15px_45px_rgba(239,68,68,0.55)]",

    secondary:
      "relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-700 text-white border border-white/10 shadow-xl hover:shadow-2xl",

    outline:
      "relative overflow-hidden bg-white/60 backdrop-blur-xl border border-slate-200 text-slate-800 hover:bg-white",

    ghost:
      "relative overflow-hidden bg-transparent text-slate-700 hover:bg-slate-100"
  };

  return (
    <Motion.button
      whileHover={{
        scale: 1.04,
        y: -2
      }}
      whileTap={{
        scale: 0.97
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 18
      }}
      disabled={disabled || isLoading}
      className={cn(
        "group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3 font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    >
      {/* Shine Animation */}

      <span
        className="
        absolute
        inset-y-0
        -left-20
        w-10
        rotate-12
        bg-white/30
        blur-md
        transition-all
        duration-700
        group-hover:left-[120%]
      "
      />

      {/* Glow */}

      <div
        className="
        absolute
        inset-0
        rounded-2xl
        bg-white/5
        opacity-0
        group-hover:opacity-100
        transition
      "
      />

      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Loading...</span>
        </div>
      ) : (
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      )}
    </Motion.button>
  );
}