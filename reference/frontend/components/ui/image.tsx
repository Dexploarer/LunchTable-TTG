import { type ImgHTMLAttributes, forwardRef } from "react";

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  quality?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, width, height, fill, className, style, ...props }, ref) => {
    // If fill is true, we apply absolute positioning and full width/height
    const fillStyles: React.CSSProperties = fill
      ? {
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          objectFit: "cover", // Default to cover for fill, but can be overridden by className
        }
      : {};

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ ...fillStyles, ...style }}
        loading={props.priority ? "eager" : "lazy"}
        {...props}
      />
    );
  }
);

Image.displayName = "Image";

export default Image;
