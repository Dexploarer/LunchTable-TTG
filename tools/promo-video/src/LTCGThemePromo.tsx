import {Audio} from "@remotion/media";
import type {CSSProperties, FC} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {wipe} from "@remotion/transitions/wipe";

const SCENE_DURATIONS = {
  intro: 150,
  story: 210,
  vices: 210,
  duel: 180,
  cta: 210,
} as const;

const TRANSITION_DURATION = 15;

export const fps = 30;
export const width = 1920;
export const height = 1080;
export const durationInFrames =
  SCENE_DURATIONS.intro +
  SCENE_DURATIONS.story +
  SCENE_DURATIONS.vices +
  SCENE_DURATIONS.duel +
  SCENE_DURATIONS.cta -
  TRANSITION_DURATION * 4;

const viceIcons = [
  {src: "lunchtable/vices/crypto.png", label: "Crypto"},
  {src: "lunchtable/vices/social-media.png", label: "Clout"},
  {src: "lunchtable/vices/gambling.png", label: "Risk"},
  {src: "lunchtable/vices/narcissism.png", label: "Ego"},
  {src: "lunchtable/vices/validation.png", label: "Validation"},
  {src: "lunchtable/vices/adderall.png", label: "Overdrive"},
] as const;

const sequenceTimings = [
  SCENE_DURATIONS.intro,
  SCENE_DURATIONS.story,
  SCENE_DURATIONS.vices,
  SCENE_DURATIONS.duel,
  SCENE_DURATIONS.cta,
];

const fullScreenStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const panelTextStyle: CSSProperties = {
  fontFamily: "Outfit, Arial, sans-serif",
  color: "#fefce8",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const stampStyle: CSSProperties = {
  fontFamily: "Outfit, Arial, sans-serif",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  border: "2px solid #121212",
  background: "#fef08a",
  color: "#121212",
  padding: "8px 14px",
  display: "inline-block",
  boxShadow: "4px 4px 0 #121212",
};

const Backdrop: FC<{
  src: string;
  tint?: string;
  zoom?: number;
  pan?: number;
}> = ({src, tint = "rgba(0,0,0,0.35)", zoom = 0.1, pan = 25}) => {
  const frame = useCurrentFrame();
  const {durationInFrames: localDuration} = useVideoConfig();

  const progress = interpolate(frame, [0, localDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = 1 + zoom * progress;
  const x = interpolate(progress, [0, 1], [-pan, pan], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [pan * 0.35, -pan * 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <Img
        src={staticFile(src)}
        style={{
          ...fullScreenStyle,
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
      />
      <AbsoluteFill style={{background: tint}} />
    </AbsoluteFill>
  );
};

const GrainOverlay: FC = () => {
  const frame = useCurrentFrame();
  const scanlineShift = (frame * 2) % 8;
  const flicker = 0.05 + (Math.sin(frame * 0.21) + 1) * 0.02;
  const flash = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.02, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)",
          opacity: flicker,
          mixBlendMode: "screen",
          transform: `translateY(${scanlineShift}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(250,204,21,0.3), transparent 35%), radial-gradient(circle at 85% 80%, rgba(56,189,248,0.2), transparent 35%)",
          opacity: flash,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
};

const IntroScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps: localFps} = useVideoConfig();
  const entrance = spring({
    fps: localFps,
    frame,
    config: {damping: 200},
  });
  const logoScale = interpolate(entrance, [0, 1], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(entrance, [0, 1], [45, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [20, 70], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop src="lunchtable/landing-bg.jpg" tint="rgba(0,0,0,0.5)" zoom={0.15} pan={36} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          paddingBottom: 40,
        }}
      >
        <Img
          src={staticFile("lunchtable/logo.png")}
          style={{
            width: 420,
            height: "auto",
            transform: `scale(${logoScale})`,
            filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.55))",
          }}
        />
        <h1
          style={{
            ...panelTextStyle,
            fontSize: 86,
            margin: 0,
            transform: `translateY(${titleY}px)`,
            textShadow: "0 8px 18px rgba(0,0,0,0.5)",
          }}
        >
          School of Hard Knocks
        </h1>
        <p
          style={{
            ...panelTextStyle,
            margin: 0,
            fontSize: 30,
            color: "#fde68a",
            opacity: subtitleOpacity,
          }}
        >
          Vice-themed deck duels. No training wheels.
        </p>
      </AbsoluteFill>
      <AbsoluteFill style={{padding: 42}}>
        <div style={{...stampStyle, transform: "rotate(-2deg)"}}>New Promo Cut</div>
      </AbsoluteFill>
      <GrainOverlay />
    </AbsoluteFill>
  );
};

const StoryScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps: localFps} = useVideoConfig();
  const rise = spring({
    fps: localFps,
    frame,
    config: {damping: 200},
  });

  const cards = [
    "lunchtable/story/story-1-1.png",
    "lunchtable/story/story-2-2.png",
    "lunchtable/story/story-3-3.png",
    "lunchtable/story/story-4-4.png",
  ];

  return (
    <AbsoluteFill>
      <Backdrop src="lunchtable/story-bg.png" tint="rgba(8,8,8,0.58)" zoom={0.09} pan={18} />
      {cards.map((src, index) => {
        const delay = index * 9;
        const pop = spring({
          fps: localFps,
          frame: frame - delay,
          config: {damping: 180},
        });
        const scale = interpolate(pop, [0, 1], [0.78, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(pop, [0, 1], [90, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const xBase = 210 + index * 400;

        return (
          <div
            key={src}
            style={{
              position: "absolute",
              top: 180 + (index % 2) * 120,
              left: xBase,
              width: 340,
              border: "4px solid #121212",
              boxShadow: "10px 10px 0 rgba(0,0,0,0.45)",
              transform: `translateY(${y}px) scale(${scale}) rotate(${index % 2 === 0 ? -3 : 3}deg)`,
              overflow: "hidden",
            }}
          >
            <Img src={staticFile(src)} style={{width: "100%", height: 220, objectFit: "cover"}} />
          </div>
        );
      })}

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 86px 86px",
          transform: `translateY(${interpolate(rise, [0, 1], [32, 0])}px)`,
        }}
      >
        <h2
          style={{
            ...panelTextStyle,
            margin: 0,
            fontSize: 76,
            lineHeight: 1.02,
            textShadow: "0 8px 18px rgba(0,0,0,0.5)",
          }}
        >
          Build your clique.
          <br />
          Rewrite the halls.
        </h2>
      </AbsoluteFill>
      <GrainOverlay />
    </AbsoluteFill>
  );
};

const VicesScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps: localFps} = useVideoConfig();
  const titleEnter = spring({
    fps: localFps,
    frame,
    config: {damping: 200},
  });

  return (
    <AbsoluteFill>
      <Backdrop src="lunchtable/vices/vice-splash.png" tint="rgba(5,5,5,0.62)" zoom={0.12} pan={20} />

      {viceIcons.map((icon, index) => {
        const delay = index * 6;
        const spin = frame * 0.015 + (index * Math.PI * 2) / viceIcons.length;
        const pulse = spring({
          fps: localFps,
          frame: frame - delay,
          config: {damping: 170},
        });
        const radiusX = 520;
        const radiusY = 250;
        const x = 960 + Math.cos(spin) * radiusX;
        const y = 540 + Math.sin(spin) * radiusY;
        const scale = interpolate(pulse, [0, 1], [0.4, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={icon.src}
            style={{
              position: "absolute",
              left: x - 86,
              top: y - 86,
              width: 172,
              height: 172,
              borderRadius: "999px",
              border: "4px solid #fef08a",
              background: "rgba(10,10,10,0.55)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
              transform: `scale(${scale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Img src={staticFile(icon.src)} style={{width: 76, height: 76, objectFit: "contain"}} />
            <span
              style={{
                ...panelTextStyle,
                fontSize: 15,
                color: "#fde68a",
              }}
            >
              {icon.label}
            </span>
          </div>
        );
      })}

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.48)",
            border: "3px solid #fde68a",
            padding: "26px 30px",
            boxShadow: "10px 10px 0 rgba(0,0,0,0.35)",
            transform: `translateY(${interpolate(titleEnter, [0, 1], [28, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          <h2
            style={{
              ...panelTextStyle,
              margin: 0,
              fontSize: 72,
              lineHeight: 1,
              color: "#fef08a",
            }}
          >
            Pick your vice.
          </h2>
          <p
            style={{
              ...panelTextStyle,
              margin: "12px 0 0",
              fontSize: 28,
              color: "#fefce8",
              textTransform: "none",
              letterSpacing: "0.02em",
            }}
          >
            Push your luck. Stack your combo. Break the meta.
          </p>
        </div>
      </AbsoluteFill>
      <GrainOverlay />
    </AbsoluteFill>
  );
};

const DuelScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps: localFps} = useVideoConfig();
  const slideIn = spring({
    fps: localFps,
    frame,
    config: {damping: 200},
  });

  const leftX = interpolate(slideIn, [0, 1], [-420, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightX = interpolate(slideIn, [0, 1], [420, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop src="lunchtable/watch-bg.png" tint="rgba(5,5,5,0.58)" zoom={0.07} pan={15} />

      <div
        style={{
          position: "absolute",
          left: 110,
          top: 130,
          width: 720,
          border: "4px solid #121212",
          transform: `translateX(${leftX}px) rotate(-2.5deg)`,
          boxShadow: "12px 12px 0 rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("lunchtable/deck-bg.png")} style={{width: "100%", height: 370, objectFit: "cover"}} />
      </div>

      <div
        style={{
          position: "absolute",
          right: 100,
          top: 260,
          width: 760,
          border: "4px solid #121212",
          transform: `translateX(${rightX}px) rotate(2.5deg)`,
          boxShadow: "12px 12px 0 rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("lunchtable/about/about-3-stream.png")} style={{width: "100%", height: 360, objectFit: "cover"}} />
      </div>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "3px solid #fef08a",
            boxShadow: "8px 8px 0 rgba(0,0,0,0.45)",
            padding: "22px 26px",
          }}
        >
          <h2 style={{...panelTextStyle, margin: 0, fontSize: 76}}>Deckbuild. Duel. Dominate.</h2>
          <p style={{...panelTextStyle, margin: "10px 0 0", fontSize: 26, color: "#fde68a"}}>
            Fast turns. Heavy combos. No mercy.
          </p>
        </div>
      </AbsoluteFill>
      <GrainOverlay />
    </AbsoluteFill>
  );
};

const CtaScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps: localFps} = useVideoConfig();
  const pop = spring({
    fps: localFps,
    frame,
    config: {damping: 180},
  });
  const scale = interpolate(pop, [0, 1], [0.65, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaOpacity = interpolate(frame, [0, 24], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop src="lunchtable/stream-bg.png" tint="rgba(0,0,0,0.58)" zoom={0.11} pan={24} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
          opacity: ctaOpacity,
        }}
      >
        <Img
          src={staticFile("lunchtable/title.png")}
          style={{
            width: 1060,
            maxWidth: "86%",
            height: "auto",
            transform: `scale(${scale})`,
            filter: "drop-shadow(0 16px 26px rgba(0,0,0,0.56))",
          }}
        />
        <p
          style={{
            ...panelTextStyle,
            margin: 0,
            fontSize: 35,
            color: "#fde68a",
          }}
        >
          Play the promo build now
        </p>
        <div
          style={{
            ...stampStyle,
            transform: "rotate(-1.5deg)",
            fontSize: 34,
            padding: "14px 24px",
          }}
        >
          LunchTable TCG
        </div>
      </AbsoluteFill>

      <GrainOverlay />
    </AbsoluteFill>
  );
};

export const LTCGThemePromo: FC = () => {
  const frame = useCurrentFrame();
  const finalFade = interpolate(frame, [durationInFrames - 22, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{backgroundColor: "#050505"}}>
      <Audio
        src={staticFile("lunchtable/soundtrack/THEME.mp3")}
        trimAfter={durationInFrames}
        volume={(f) =>
          interpolate(
            f,
            [0, 45, durationInFrames - 45, durationInFrames],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )
        }
      />

      <TransitionSeries>
        <TransitionSeries.Sequence
          durationInFrames={sequenceTimings[0]}
          premountFor={fps}
        >
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
        />

        <TransitionSeries.Sequence
          durationInFrames={sequenceTimings[1]}
          premountFor={fps}
        >
          <StoryScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: "from-right"})}
          timing={springTiming({
            durationInFrames: TRANSITION_DURATION,
            config: {damping: 200},
          })}
        />

        <TransitionSeries.Sequence
          durationInFrames={sequenceTimings[2]}
          premountFor={fps}
        >
          <VicesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({direction: "from-top-left"})}
          timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
        />

        <TransitionSeries.Sequence
          durationInFrames={sequenceTimings[3]}
          premountFor={fps}
        >
          <DuelScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
        />

        <TransitionSeries.Sequence
          durationInFrames={sequenceTimings[4]}
          premountFor={fps}
        >
          <CtaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <AbsoluteFill style={{backgroundColor: "#000000", opacity: finalFade}} />
    </AbsoluteFill>
  );
};
