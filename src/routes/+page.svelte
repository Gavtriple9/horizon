<script lang="ts">
  import BarGauge from "$lib/components/graphics/BarGauge.svelte";
  import Gauge from "$lib/components/graphics/Gauge.svelte";
  import Model from "$lib/components/graphics/Model.svelte";
  import Stat from "$lib/components/graphics/Stat.svelte";

  import Timeseries from "$lib/components/plots/TimeSeries.svelte";
</script>

<div class="main-demo">
  <BarGauge />
  <Gauge value={0.0} />
  <Gauge value={0.25} />
  <Gauge value={0.5} />
  <Gauge value={0.75} />
  <Gauge value={1.0} />
  <Model />
  <Stat />
  <Timeseries />
</div>
