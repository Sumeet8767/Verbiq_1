import { motion as Motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const SkeletonLoader = ({ className }) => {
  return (
    <div className={cn("animate-pulse bg-slate-200 rounded-xl", className)}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
};

export const QuestionSkeleton = () => {
  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-start">
        <SkeletonLoader className="w-32 h-6" />
        <SkeletonLoader className="w-10 h-10" />
      </div>
      <SkeletonLoader className="w-full h-12" />
      <SkeletonLoader className="w-3/4 h-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonLoader key={i} className="w-full h-20" />
        ))}
      </div>
    </div>
  );
};
