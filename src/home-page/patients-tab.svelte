<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { API_ADDRESS } from "$src/config";

  const onStartRecord = () => {
    fetch(`${API_ADDRESS}/api/log/session/start`)
  }

  const onStopRecord = () => {
    fetch(`${API_ADDRESS}/api/log/session/stop`)
  }
</script>

<Button onclick={onStartRecord}>
  Start record
</Button>
<Button onclick={onStopRecord}>
  Stop record
</Button>