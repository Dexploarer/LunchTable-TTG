import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "avatar" | "text" | "button";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variantClasses = {
    default: "",
    card: "aspect-[3/4] rounded-xl",
    avatar: "rounded-full",
    text: "h-4 rounded",
    button: "h-10 rounded-lg",
  };

  return (
    <div
      className={cn("animate-pulse bg-muted/50", variantClasses[variant], className)}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton variant="card" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-[#3d2b1f]">
      <Skeleton variant="avatar" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
      <Skeleton variant="button" className="w-20" />
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="w-20 h-20" />
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-6" />
          <Skeleton variant="text" className="w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonProfile };
