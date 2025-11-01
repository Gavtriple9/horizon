<script lang="ts">
  import BarGauge from "$lib/components/graphics/BarGauge.svelte";
  import Gauge from "$lib/components/graphics/Gauge.svelte";
  import Model from "$lib/components/graphics/Model.svelte";
  import Stat from "$lib/components/graphics/Stat.svelte";

  import Timeseries from "$lib/components/plots/TimeSeries.svelte";
</script>

<div class="main-demo">
  <BarGauge />
  <Gauge value={0.00123} />
  <Gauge value={0.22235} />
  <Gauge value={0.2312} />
  <Gauge value={0.7215} />
  <Gauge value={1.021} />
  <Model />
  <Stat />
  <Timeseries />
</div>
