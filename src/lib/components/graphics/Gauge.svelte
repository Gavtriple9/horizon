<script lang="ts">
  import { arc } from "d3";
  import type { DefaultArcObject } from "d3";
  import { clamp, lerp, normalizeClamped } from "$lib/utils/interpolate";

  interface Props {
    value: number;

    min?: number;
    max?: number;
    size?: number;
    thickness?: number;
    trackColor?: string;
    fillColor?: string;
    backgroundColor?: string;
    displayAsPercent?: boolean;
  }

  const START_ANGLE = toRadians(-120);
  const END_ANGLE = toRadians(120);
  const THRESHOLD_SEGMENTS = [
    { start: 0, end: 0.7, color: "#22c55e" },
    { start: 0.7, end: 0.9, color: "#facc15" },
    { start: 0.9, end: 1.0, color: "#ef4444" },
  ];

  let {
    value,

    min = 0,
    max = 1,
    size = 140,
    thickness = 20,
    trackColor = "rgba(148, 163, 184, 0.25)",
    fillColor = "#38bdf8",
    backgroundColor = "transparent",
    displayAsPercent = true,
  }: Props = $props();

  const arcFactory = arc();
  const outerArcFactory = arc();

  let trackPath = $state("");
  let fillPath = $state("");
  let normalizedValue = $state(0);
  let outerSegments = $state<{ path: string; color: string }[]>([]);
  let computedFillColor = $state(fillColor);
  let displayValue = $derived(
    displayAsPercent ? `${(normalizedValue * 100).toFixed(1)}%` : `${value}`
  );

  let ariaMin = $derived(Math.min(min, max));
  let ariaMax = $derived(Math.max(min, max));
  let ariaValue = $derived(clamp(value, ariaMin, ariaMax));

  $effect(() => {
    const overallRadius = size / 2;
    const ringThickness = Math.max(thickness, 0);
    const outerRingThickness = Math.min(
      Math.max(ringThickness * 0.35, 2),
      Math.max(overallRadius, 0)
    );
    const gap = Math.min(
      Math.max(outerRingThickness * 0.2, 1),
      Math.max(overallRadius - outerRingThickness, 0)
    );
    const mainOuterRadius = Math.max(
      overallRadius - outerRingThickness - gap,
      0
    );
    const innerRadius = Math.max(mainOuterRadius - ringThickness, 0);

    arcFactory
      .innerRadius(innerRadius)
      .outerRadius(mainOuterRadius)
      .cornerRadius(0);

    const baseArc: DefaultArcObject = {
      innerRadius,
      outerRadius: mainOuterRadius,
      startAngle: START_ANGLE,
      endAngle: END_ANGLE,
    };

    trackPath = arcFactory(baseArc) ?? "";

    normalizedValue = normalizeClamped(value, min, max);

    if (normalizedValue <= 0) {
      fillPath = "";
    } else {
      const fillEndAngle = lerp(START_ANGLE, END_ANGLE, normalizedValue);

      fillPath =
        arcFactory({
          ...baseArc,
          endAngle: fillEndAngle,
        }) ?? "";
    }

    const outerInnerRadius = Math.max(overallRadius - outerRingThickness, 0);

    outerArcFactory
      .innerRadius(outerInnerRadius)
      .outerRadius(overallRadius)
      .cornerRadius(0);

    outerSegments = THRESHOLD_SEGMENTS.map((segment) => {
      const segmentStart = Math.max(segment.start, 0);
      const segmentEnd = Math.min(segment.end, 1);

      if (segmentEnd <= segmentStart) {
        return null;
      }

      const segmentPath =
        outerArcFactory({
          innerRadius: outerInnerRadius,
          outerRadius: overallRadius,
          startAngle: lerp(START_ANGLE, END_ANGLE, segmentStart),
          endAngle: lerp(START_ANGLE, END_ANGLE, segmentEnd),
        }) ?? "";

      return {
        path: segmentPath,
        color: segment.color,
      };
    }).filter(Boolean) as { path: string; color: string }[];

    const activeSegment =
      THRESHOLD_SEGMENTS.find((segment) => normalizedValue <= segment.end) ??
      THRESHOLD_SEGMENTS[THRESHOLD_SEGMENTS.length - 1];

    computedFillColor = activeSegment?.color ?? fillColor;
  });

  function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
</script>

<div
  class="BarGauge"
  style={`--gauge-size: ${size}px; --gauge-track: ${trackColor}; --gauge-fill: ${computedFillColor}; --gauge-background: ${backgroundColor};`}
  role="progressbar"
  aria-valuemin={ariaMin}
  aria-valuemax={ariaMax}
  aria-valuenow={ariaValue}
>
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    aria-hidden="true"
  >
    <g transform={`translate(${size / 2}, ${size / 2})`}>
      {#each outerSegments as segment (segment.path)}
        <path class="BarGauge__outer" d={segment.path} fill={segment.color} />
      {/each}
      <path class="BarGauge__track" d={trackPath} />
      {#if normalizedValue > 0}
        <path class="BarGauge__fill" d={fillPath} />
      {/if}
    </g>
  </svg>
  <div class="BarGauge__content">
    <span class="BarGauge__value">{displayValue}</span>
  </div>
</div>

<style>
  .BarGauge {
    --gauge-size: 160px;
    --gauge-track: rgba(148, 163, 184, 0.25);
    --gauge-fill: #38bdf8;
    --gauge-background: transparent;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--gauge-size);
    height: var(--gauge-size);
    background-color: var(--gauge-background);
    border-radius: 9999px;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .BarGauge__track {
    fill: var(--gauge-track);
  }

  .BarGauge__fill {
    fill: var(--gauge-fill);
  }

  .BarGauge__content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .BarGauge__value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--gauge-fill);
  }
</style>
