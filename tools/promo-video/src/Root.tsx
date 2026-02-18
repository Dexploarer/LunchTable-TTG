import {Composition} from "remotion";
import {
  LTCGThemePromo,
  durationInFrames,
  fps,
  height,
  width,
} from "./LTCGThemePromo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="LTCGThemePromo"
      component={LTCGThemePromo}
      durationInFrames={durationInFrames}
      fps={fps}
      width={width}
      height={height}
    />
  );
};
