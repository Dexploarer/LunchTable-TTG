"use client";

import { Image } from "@/components/ui/image";
import { formatArchetypeName, getArchetypeIcon } from "@/lib/archetypeIcons";
import { cn } from "@/lib/utils";

interface ArchetypeIconProps {
  archetype: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showLabel?: boolean;
  rounded?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

/**
 * Archetype Icon Component
 *
 * Displays an archetype icon from the brand assets.
 * Automatically handles legacy archetype names and provides fallbacks.
 *
 * @example
 * ```tsx
 * <ArchetypeIcon archetype="dropout" size="md" />
 * <ArchetypeIcon archetype="prep" size="lg" showLabel />
 * ```
 */
export function ArchetypeIcon({
  archetype,
  size = "md",
  className,
  showLabel = false,
  rounded = true,
}: ArchetypeIconProps) {
  const iconPath = getArchetypeIcon(archetype);
  const displayName = formatArchetypeName(archetype);
  const pixelSize = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-black/20",
          rounded && "rounded-lg",
          "ring-1 ring-white/10"
        )}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src={iconPath}
          alt={archetype}
          width={pixelSize}
          height={pixelSize}
          className={className}
        />
      </div>
      {showLabel && <span className="text-sm font-medium text-foreground/90">{displayName}</span>}
    </div>
  );
}

/**
 * Archetype Badge - Compact version with just the icon
 */
export function ArchetypeBadge({
  archetype,
  className,
}: {
  archetype: string;
  className?: string;
}) {
  return <ArchetypeIcon archetype={archetype} size="sm" className={className} />;
}
