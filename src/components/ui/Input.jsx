import { cn } from "../../utils/cn";

export const Input = ({
  label,
  error,
  className,
  rightIcon,
  onRightIconClick,
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          className="
            ml-1
            text-sm
            font-semibold
            tracking-wide
            text-slate-700
          "
        >
          {label}
        </label>
      )}

      <div className="relative group">

        {/* Glow */}

        <div
          className="
            absolute
            inset-0
            rounded-2xl
            bg-gradient-to-r
            from-red-500/10
            via-cyan-500/10
            to-purple-500/10
            opacity-0
            blur-xl
            transition
            duration-300
            group-focus-within:opacity-100
          "
        />

        <input
          className={cn(
            `
            relative
            w-full
            rounded-2xl
            border
            border-slate-200/80
            bg-white/70
            backdrop-blur-xl
            pl-5
            pr-12
            py-3.5
            text-slate-800
            shadow-sm
            transition-all
            duration-300

            placeholder:text-slate-400

            hover:border-red-300

            focus:border-red-500
            focus:ring-4
            focus:ring-red-500/10
            focus:outline-none

            disabled:bg-slate-100
            disabled:cursor-not-allowed
            `,
            error &&
              `
              border-red-500
              focus:border-red-500
              focus:ring-red-500/20
              `,
            className
          )}
          {...props}
        />

          {rightIcon && (
            <button
              type="button"
              aria-label="Toggle password visibility"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onRightIconClick}
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-slate-400
                hover:text-primary
                transition-colors
                cursor-pointer
                focus:outline-none  
              "
            >
              {rightIcon}
            </button>
          )}
      </div>

      {error && (
        <p className="ml-1 text-sm font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};