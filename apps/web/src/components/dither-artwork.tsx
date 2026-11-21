import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/dither/motion";
import { DitherShader } from "@/lib/dither/shader";

import "./dither-artwork.css";

const field = `
float field(vec2 uv, vec2 res, float t) {
  float x = uv.x;
  float y = uv.y + 0.27 * (x - 0.5);
  float center = 0.54 + 0.15 * sin(x * 6.5 + 0.6 + t * 0.19)
    + 0.08 * sin(x * 12.0 - t * 0.12);
  float bend = y - center;
  float mainRibbon = 0.78 * exp(-abs(bend) * 18.0);
  float upperRibbon = 0.48 * exp(-abs(bend - 0.14 - 0.045 * cos(x * 9.0 + t * 0.14)) * 27.0);
  float lowerRibbon = 0.50 * exp(-abs(bend + 0.16 + 0.045 * sin(x * 8.0 - t * 0.16)) * 24.0);
  float rays = 0.72 + 0.28 * sin(x * 96.0 + y * 16.0 + t * 0.24);
  float haze = 0.12 * exp(-abs(bend) * 4.0) * rays;
  float edge = smoothstep(0.0, 0.18, x) * smoothstep(0.0, 0.16, 1.0 - x);
  return clamp((mainRibbon + upperRibbon + lowerRibbon + haze) * (0.56 + 0.44 * edge), 0.0, 0.98);
}
`;

const colorField = `
vec4 colorField(vec2 uv, vec2 res, float t) {
  return paletteColor(clamp(uv.x * 0.70 + uv.y * 0.36 + 0.07 * sin(uv.x * 7.0 + t * 0.10), 0.0, 1.0));
}
`;

const palette = [
  "--dither-paper",
  "--dither-violet",
  "--dither-periwinkle",
  "--dither-seafoam",
] as const;

export const DitherArtwork = ({ animated = false }: { animated?: boolean }) => {
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative size-full overflow-hidden">
      <DitherShader
        className="absolute inset-0"
        field={field}
        colorField={colorField}
        palette={palette}
        animate={animated && !paused}
        matrix="bayer8"
        cell={3}
        speed={0.58}
        fps={24}
        stillTime={2}
        fallback={<div className="dither-artwork-fallback absolute inset-0" />}
      />
      {animated && !reducedMotion && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="bg-background/90 absolute right-3 bottom-3 shadow-sm"
          aria-label={paused ? "Play animation" : "Pause animation"}
          title={paused ? "Play animation" : "Pause animation"}
          onClick={() => setPaused((current) => !current)}
        >
          <HugeiconsIcon
            icon={paused ? PlayIcon : PauseIcon}
            aria-hidden="true"
          />
        </Button>
      )}
    </div>
  );
};
