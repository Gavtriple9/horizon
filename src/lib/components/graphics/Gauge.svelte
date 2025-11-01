<script lang="ts">
  import { arc } from "d3";
  import { onMount } from "svelte";
  import type { DefaultArcObject } from "d3";
  import { clamp, lerp, normalizeClamped } from "$lib/utils/interpolate";

  interface Props {
    value: number;

    min?: number;
    max?: number;
    size?: number;
    warnThreshold?: number;
    dangerThreshold?: number;
    thickness?: number;
    trackColor?: string;
    fillColor?: string;
    backgroundColor?: string;
    displayAsPercent?: boolean;
  }

  let {
    value,

    min = 0,
    max = 1,
    size = 0,
    warnThreshold = 0.7,
    dangerThreshold = 0.9,
    thickness = 0.2,
    trackColor = "rgba(148, 163, 184, 0.25)",
    fillColor = "#38bdf8",
    backgroundColor = "transparent",
    displayAsPercent = true,
  }: Props = $props();

  const START_ANGLE = toRadians(-120);
  const END_ANGLE = toRadians(120);
  const THRESHOLD_SEGMENTS = [
    { start: 0, end: warnThreshold, color: "#22c55e" },
    { start: warnThreshold, end: dangerThreshold, color: "#facc15" },
    { start: dangerThreshold, end: 1.0, color: "#ef4444" },
  ];

  const arcFactory = arc();
  const outerArcFactory = arc();

  let trackPath = $state("");
  let fillPath = $state("");
  let normalizedValue = $state(0);
  let outerSegments = $state<{ path: string; color: string }[]>([]);
  let computedFillColor = $state(fillColor);
  let measuredSize = $state(0);
  let gaugeSize = $derived(Math.max(measuredSize || size || 0, 0));
  let fontSize = $derived(gaugeSize * 0.18);
  let showValue = $derived(gaugeSize >= 64);
  let displayValue = $derived(
    displayAsPercent ? `${(normalizedValue * 100).toFixed(1)}%` : `${value}`
  );
  let viewBoxSize = $derived(gaugeSize > 0 ? gaugeSize : 1);

  let ariaMin = $derived(Math.min(min, max));
  let ariaMax = $derived(Math.max(min, max));
  let ariaValue = $derived(clamp(value, ariaMin, ariaMax));

  let container: HTMLDivElement | null = null;

  onMount(() => {
    if (typeof ResizeObserver === "undefined" || !container) {
      measuredSize = size;
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const nextSize = Math.min(width, height);
        if (Number.isFinite(nextSize) && nextSize > 0) {
          measuredSize = nextSize;
        }
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  });

  $effect(() => {
    normalizedValue = normalizeClamped(value, min, max);

    if (gaugeSize <= 0) {
      trackPath = "";
      fillPath = "";
      outerSegments = [];
      computedFillColor = fillColor;
      return;
    }

    const radius = gaugeSize / 2;
    const normalizedThickness = clamp(
      gaugeSize > 0
        ? thickness > 1
          ? thickness / radius
          : thickness
        : thickness,
      0,
      1
    );
    const ringThickness = Math.max(normalizedThickness * radius, 0);
    const outerRingRatio = clamp(
      normalizedThickness > 0 ? normalizedThickness * 0.35 : 0.08,
      0.04,
      0.25
    );
    const outerRingThickness = outerRingRatio * radius;
    const gapRatio = clamp(outerRingRatio * 0.6, 0.02, 0.12);
    const gap = gapRatio * radius;
    const mainOuterRadius = Math.max(radius - outerRingThickness - gap, 0);
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

    const outerInnerRadius = Math.max(radius - outerRingThickness, 0);

    outerArcFactory
      .innerRadius(outerInnerRadius)
      .outerRadius(radius)
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
          outerRadius: radius,
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
  bind:this={container}
  class="relative inline-flex aspect-square w-full max-w-full items-center justify-center rounded-full"
  style:background-color={backgroundColor}
  role="progressbar"
  aria-valuemin={ariaMin}
  aria-valuemax={ariaMax}
  aria-valuenow={ariaValue}
>
  <svg
    class="h-full w-full"
    width="100%"
    height="100%"
    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
    aria-hidden="true"
  >
    <g transform={`translate(${viewBoxSize / 2}, ${viewBoxSize / 2})`}>
      {#each outerSegments as segment (segment.path)}
        <path d={segment.path} fill={segment.color} />
      {/each}
      <path d={trackPath} fill={trackColor} />
      {#if normalizedValue > 0}
        <path d={fillPath} fill={computedFillColor} />
      {/if}
    </g>
  </svg>
  <div class="absolute inset-0 flex items-center justify-center">
    {#if showValue}
      <span
        class="text-center font-semibold leading-none"
        style={`font-size: ${fontSize}px; color: ${computedFillColor};`}
      >
        {displayValue}
      </span>
    {/if}
  </div>
</div>
