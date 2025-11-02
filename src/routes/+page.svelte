<script lang="ts">
  import { onDestroy } from "svelte";
  import BarGauge from "$lib/components/graphics/BarGauge.svelte";
  import Gauge from "$lib/components/graphics/Gauge.svelte";
  import Model from "$lib/components/graphics/Model.svelte";
  import Stat from "$lib/components/graphics/Stat.svelte";

  import Timeseries from "$lib/components/plots/TimeSeries.svelte";

  let frequency = 0.25; //Hz
  let phase0 = 0; //radians
  let phase1 = Math.PI / 3;
  let phase2 = (2 * Math.PI) / 3;
  let phase3 = Math.PI;
  let data1 = $state(0);
  let data2 = $state(0);
  let data3 = $state(0);
  let data4 = $state(0);
  const interval = setInterval(() => {
    const time = Date.now() / 1000;
    data1 = Math.sin(time * frequency * 2 * Math.PI + phase0);
    data2 = Math.sin(time * frequency * 2 * Math.PI + phase1);
    data3 = Math.sin(time * frequency * 2 * Math.PI + phase2);
    data4 = Math.sin(time * frequency * 2 * Math.PI + phase3);
  }, 10);

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="main-demo flex flex-col items-center">
  <div class="w-1/2">
    <div class="flex flex-col flex-wrap gap-1 justify-center mb-4">
      <BarGauge value={data1} label="Data 1" min={-1} max={1} />
      <BarGauge value={data2} label="Data 2" min={-1} max={1} />
      <BarGauge value={data3} label="Data 3" min={-1} max={1} />
      <BarGauge value={data4} label="Data 4" min={-1} max={1} />
    </div>
  </div>
  <div class="flex flex-row flex-wrap gap-4 justify-center">
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={data1} min={-1} max={1} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={data2} min={-1} max={1} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={data3} min={-1} max={1} />
    </div>
    <div class="basis-[15%] min-w-[120px]">
      <Gauge value={data4} min={-1} max={1} />
    </div>
  </div>
  <div class="w-1/2 my-4 bg-gray-600">
    <Model src="/models/DragonAttenuation.glb" />
  </div>
  <Stat />
  <Timeseries />
</div>
