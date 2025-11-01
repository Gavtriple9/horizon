<script lang="ts">
  import BarGauge from "$lib/components/graphics/BarGauge.svelte";
  import Gauge from "$lib/components/graphics/Gauge.svelte";
  import Model from "$lib/components/graphics/Model.svelte";
  import Stat from "$lib/components/graphics/Stat.svelte";

  import Timeseries from "$lib/components/plots/TimeSeries.svelte";
</script>

<div class="main-demo bg-gray-600">
  <BarGauge />
  <div class="flex flex-row flex-wrap gap-4">
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={0.00123} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={0.22235} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={0.2312} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={0.7215} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={1.021} />
    </div>
  </div>
  <Model src="/models/DragonAttenuation.glb" />
  <Stat />
  <Timeseries />
</div>
