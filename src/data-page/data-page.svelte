<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import { API_ADDRESS, WS_API_ADDRESS } from "$src/config";

	export let readDataStream: boolean = false;

	type ServiceStatusType = {
		name: string;
		cpuUsage: number;
	};

	let serviceStatusData: ServiceStatusType[] = [];
	let ws: WebSocket;

	const wsDisconnect = () => {
		if (ws) {
			ws.close();
		}
	};

	const wsConnect = async () => {
		ws = new WebSocket(`${WS_API_ADDRESS}/api/data`);

		ws.onopen = () => {
			console.log("Connected to ESP32");
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			serviceStatusData = [];
			for (const key in data) {
				const serviceNameEnd = key.search("CpuUsage");
				if (serviceNameEnd < 0) {
					continue;
				}
				const serviceName = key.substring(0, serviceNameEnd);
				serviceStatusData.push({
					name: serviceName,
					cpuUsage: data[key],
				});
				serviceStatusData.sort((a, b) => b.cpuUsage - a.cpuUsage)
			}
		};

		ws.onclose = () => {
			console.log("Disconnected");
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};
	};

	$: if (readDataStream) {
		wsConnect();
		fetch(`${API_ADDRESS}/api/streams/start/imu`);
		fetch(`${API_ADDRESS}/api/streams/start/cpu_usage`);
	} else {
		wsDisconnect();
		fetch(`${API_ADDRESS}/api/streams/stop/imu`);
		fetch(`${API_ADDRESS}/api/streams/stop/cpu_usage`);
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-[100px]">Service</Table.Head>
			<Table.Head>CPU Usage</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each serviceStatusData as serviceStatus (serviceStatus)}
			<Table.Row>
				<Table.Cell class="font-medium">{serviceStatus.name}</Table.Cell>
				<Table.Cell>{serviceStatus.cpuUsage.toFixed(1)}%</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
