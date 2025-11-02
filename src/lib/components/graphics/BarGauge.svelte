<script lang="ts">
  import * as d3 from "d3";
  import { onMount } from "svelte";

  interface Props {
    value: number;
    min?: number;
    max?: number;
    label?: string;
  }

  let { value, min = 0, max = 1, label = "value" }: Props = $props();

  const gaugeHeight = 12;
  const markerWidth = 3;

  let meter: HTMLDivElement | null = null;
  let gaugeWidth = 0;
  let hasInitialised = false;

  const scale = d3.scaleLinear<number, number>().clamp(true);

  let svg: d3.Selection<SVGSVGElement, unknown, any, any> | null = null;
  let track: d3.Selection<SVGRectElement, unknown, any, any> | null = null;
  let fill: d3.Selection<SVGRectElement, unknown, any, any> | null = null;
  let marker: d3.Selection<SVGRectElement, unknown, any, any> | null = null;

  const formatValue = d3.format(".2f");
  const formattedValue = $derived.by(() =>
    Number.isFinite(value) ? formatValue(value) : "--"
  );

  function normalizeDomain(): [number, number] {
    let lower = Number.isFinite(min) ? min : 0;
    let upper = Number.isFinite(max) ? max : lower + 1;
    if (lower > upper) {
      const temp = lower;
      lower = upper;
      upper = temp;
    }
    if (lower === upper) {
      upper = lower + 1;
    }
    return [lower, upper];
  }

  function updateScaleDomain(): void {
    const [lower, upper] = normalizeDomain();
    scale.domain([lower, upper]);
  }

  function computeFillWidth(): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (min === max) {
      return value >= Math.max(min, max) ? gaugeWidth : 0;
    }
    return scale(value);
  }

  function getMarkerX(width: number): number {
    if (gaugeWidth <= 0) {
      return 0;
    }
    const centered = width - markerWidth / 2;
    const maxX = Math.max(gaugeWidth - markerWidth, 0);
    return Math.max(0, Math.min(centered, maxX));
  }

  function drawFill(immediate = false): void {
    if (!fill) {
      return;
    }
    const width = Math.max(0, Math.min(computeFillWidth(), gaugeWidth));
    if (immediate || !hasInitialised) {
      fill.interrupt().attr("width", width);
      marker
        ?.interrupt()
        .attr("x", getMarkerX(width))
        .attr("width", markerWidth);
      hasInitialised = true;
      return;
    }
    fill
      .interrupt()
      .transition()
      .duration(180)
      .ease(d3.easeCubicOut)
      .attr("width", width);

    marker
      ?.interrupt()
      .transition()
      .duration(180)
      .ease(d3.easeCubicOut)
      .attr("x", getMarkerX(width))
      .attr("width", markerWidth);
  }

  onMount(() => {
    if (!meter) {
      return;
    }

    const svgSelection = d3
      .select(meter)
      .append("svg")
      .attr("class", "BarGauge__svg")
      .attr("height", gaugeHeight)
      .attr("role", "presentation");

    svg = svgSelection;

    const trackSelection = svgSelection
      .append("rect")
      .attr("class", "BarGauge__track")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", gaugeHeight)
      .attr("rx", 0)
      .attr("ry", 0);

    track = trackSelection;

    const fillSelection = svgSelection
      .append("rect")
      .attr("class", "BarGauge__fill")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", gaugeHeight)
      .attr("rx", 0)
      .attr("ry", 0)
      .attr("width", 0);

    fill = fillSelection;

    const markerSelection = svgSelection
      .append("rect")
      .attr("class", "BarGauge__marker")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", gaugeHeight)
      .attr("width", markerWidth);

    marker = markerSelection;

    updateScaleDomain();

    function applyWidth(rawWidth: number, immediate: boolean): void {
      const width = Math.max(0, rawWidth);
      gaugeWidth = width;
      svgSelection.attr("width", width);
      trackSelection.attr("width", width);
      markerSelection.attr("height", gaugeHeight);
      scale.range([0, width]);
      drawFill(immediate);
    }

    applyWidth(meter.getBoundingClientRect().width, true);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(([entry]) => {
            if (!entry) {
              return;
            }
            applyWidth(entry.contentRect.width, !hasInitialised);
          })
        : null;

    if (resizeObserver) {
      resizeObserver.observe(meter);
    } else {
      applyWidth(meter.getBoundingClientRect().width, true);
    }

    requestAnimationFrame(() => {
      if (!meter) {
        return;
      }
      applyWidth(meter.getBoundingClientRect().width, !hasInitialised);
    });

    return () => {
      resizeObserver?.disconnect();
      svg?.remove();
      svg = null;
      track = null;
      fill = null;
      marker = null;
    };
  });

  $effect(() => {
    updateScaleDomain();
    if (gaugeWidth > 0) {
      drawFill(!hasInitialised);
    }
  });

  $effect(() => {
    if (gaugeWidth > 0) {
      drawFill();
    }
  });
</script>

<div
  class="BarGauge"
  role="meter"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-label={label}
>
  {#if label}
    <span class="BarGauge__label">{label}</span>
  {/if}
  <div class="BarGauge__meter" bind:this={meter}></div>
  <span class="BarGauge__value">{formattedValue}</span>
</div>

<style>
  .BarGauge {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .BarGauge__label {
    font-size: 0.875rem;
    color: var(--bar-gauge-label, rgba(226, 232, 240, 0.86));
    white-space: nowrap;
  }

  .BarGauge__value {
    font-variant-numeric: tabular-nums;
    font-size: 0.875rem;
    color: var(--bar-gauge-value, rgba(226, 232, 240, 0.86));
    white-space: nowrap;
    text-align: right;
  }

  .BarGauge__meter {
    flex: 1;
    min-width: 0;
  }

  :global(.BarGauge__svg) {
    display: block;
    width: 100%;
  }

  :global(.BarGauge__fill) {
    fill: var(--bar-gauge-fill, #5b8def);
  }

  :global(.BarGauge__track) {
    fill: var(--bar-gauge-track, rgba(148, 163, 184, 0.25));
    stroke: var(--bar-gauge-outline, rgba(255, 255, 255, 0.24));
    stroke-width: 1;
  }

  :global(.BarGauge__marker) {
    fill: var(--bar-gauge-marker, #cbd5f5);
  }
</style>
