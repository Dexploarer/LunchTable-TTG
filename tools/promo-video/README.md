# LTCG Theme Promo (Remotion)

This folder contains a Remotion promo composition that uses LunchTable assets and the in-repo soundtrack theme track.

## Output

- Composition ID: `LTCGThemePromo`
- Render target: `out/ltcg-theme-promo.mp4`
- Resolution: `1920x1080`
- FPS: `30`
- Duration: `30s` (900 frames)
- Audio: `public/lunchtable/soundtrack/THEME.mp3`

## Commands

```bash
cd tools/promo-video
bun install
bun run render
```

For faster draft renders:

```bash
bun run render:quick
```

## Notes on AI video skills

This composition is built so it works with no external API keys.

If you want to replace scenes with generated AI clips, drop clips into `public/` and swap them into the scene components in `src/LTCGThemePromo.tsx`.
