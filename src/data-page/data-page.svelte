<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tabs from "$lib/components/ui/tabs";
	import { API_ADDRESS, WS_API_ADDRESS } from "$src/config";
	import { LineChart } from "layerchart";
	import * as Chart from "$lib/components/ui/chart/index.js";

	export let readDataStream: boolean = false;

	type ServiceStatusType = {
		name: string;
		cpuUsage: number;
	};

	type ImuData = {
		x: number;
		y: number;
		z: number;
	};

	type ImuChartData = {
		t: number;
		y: number;
		x: number;
		z: number;
	};

	type DataTab = "stm-task-data" | "esp-task-data" | "imu";

	let serviceStatusData: ServiceStatusType[] = [];
	let ws: WebSocket;

	let dataTab: DataTab = "stm-task-data";

	const wsDisconnect = () => {
		if (ws) {
			ws.close();
		}
	};

	let imuChartData: ImuChartData[] = [];
	let imuT = 0;

	const appendImuData = (imuData: ImuData) => {
		imuChartData = [
			...(imuChartData.length <= 200
				? imuChartData
				: imuChartData.slice(1, imuChartData.length)),
			{
				t: imuT,
				x: imuData.x,
				y: imuData.y,
				z: imuData.z,
			},
		];
		imuT++;
	};

	const wsConnect = async () => {
		imuChartData = [];
		ws = new WebSocket(`${WS_API_ADDRESS}/api/data`);

		ws.onopen = () => {
			console.log("Connected to ESP32");
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			serviceStatusData = [];
			const stmCpuUsages = data["stmCpuUsage"];
			const espCpuUsages = data["espCpuUsage"];
			const imuData = data["imu"];
			const taskData = dataTab == "stm-task-data" ? stmCpuUsages : espCpuUsages;
			if (imuData) appendImuData(imuData);
			for (const serviceName in taskData) {
				serviceStatusData.push({
					name: serviceName,
					cpuUsage: taskData[serviceName],
				});
			}
			serviceStatusData.push({
				name: "total",
				cpuUsage: serviceStatusData.reduce(
					(acc, curr) => (acc += curr.cpuUsage),
					0,
				),
			});
			// serviceStatusData.sort((a, b) => b.cpuUsage - a.cpuUsage);
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
		if (dataTab == "esp-task-data") {
			fetch(`${API_ADDRESS}/api/streams/start/esp_cpu_usage`);
		}
		if (dataTab == "stm-task-data") {
			fetch(`${API_ADDRESS}/api/streams/start/stm_cpu_usage`);
		}
		if (dataTab == "imu") {
			fetch(`${API_ADDRESS}/api/streams/start/imu`);
		}
	} else {
		fetch(`${API_ADDRESS}/api/streams/stop/imu`);
		fetch(`${API_ADDRESS}/api/streams/stop/stm_cpu_usage`);
		fetch(`${API_ADDRESS}/api/streams/stop/esp_cpu_usage`);
		wsDisconnect();
	}

	const imuXSeries = [
		{
			key: "x",
			label: "x",
			color: "red",
		},
	];

	const imuYSeries = [
		{
			key: "y",
			label: "y",
			color: "red",
		},
	];

	const imuZSeries = [
		{
			key: "z",
			label: "z",
			color: "red",
		},
	];

	const chartConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	const onDataTabChange = (dataTab: string) => {
		fetch(
			`${API_ADDRESS}/api/streams/${dataTab == "imu" ? "start" : "stop"}/imu`,
		);
		fetch(
			`${API_ADDRESS}/api/streams/${dataTab == "stm-task-data" ? "start" : "stop"}/stm_cpu_usage`,
		);
		fetch(
			`${API_ADDRESS}/api/streams/${dataTab == "esp-task-data" ? "start" : "stop"}/esp_cpu_usage`,
		);
	};
</script>

<Tabs.Root
	bind:value={dataTab}
	class="h-full w-full flex-1 flex flex-col overflow-hidden gap-0"
	onValueChange={onDataTabChange}
>
	<Tabs.List class="w-full rounded-none min-h-20">
		<Tabs.Trigger class="flex flex-col" value="stm-task-data"
			>STM32 Tasks</Tabs.Trigger
		>
		<Tabs.Trigger class="flex flex-col" value="esp-task-data"
			>ESP32 Tasks</Tabs.Trigger
		>
		<Tabs.Trigger class="flex flex-col" value="imu">IMU</Tabs.Trigger>
	</Tabs.List>

	<Tabs.Content value="stm-task-data" class="overflow-y-scroll flex-1">
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
						<Table.Cell
							style={`background-color: hsl(44, 100%, ${Math.max(100 - 50 * (Math.log10(serviceStatus.cpuUsage + 1) / Math.log10(101)), 40)}%);`}
							>{serviceStatus.cpuUsage.toFixed(1)}%</Table.Cell
						>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Tabs.Content>
	<Tabs.Content value="esp-task-data" class="overflow-y-scroll flex-1">
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
						<Table.Cell
							style={`background-color: hsl(44, 100%, ${Math.max(100 - 50 * (Math.log10(serviceStatus.cpuUsage + 1) / Math.log10(101)), 40)}%);`}
							>{serviceStatus.cpuUsage.toFixed(1)}%</Table.Cell
						>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Tabs.Content>
	<Tabs.Content
		value="imu"
		class="overflow-y-scroll flex-1 flex flex-col gap-10"
	>
		<div class="flex">
			<div class="w-10 flex justify-center items-center">
				<p class="rotate-90">Pitch</p>
			</div>
			<div class="flex-1">
				<Chart.Container config={chartConfig}>
					<LineChart
						data={imuChartData}
						x="t"
						axis="x"
						series={imuXSeries}
						props={{
							highlight: { points: { r: 4 } },
						}}
						yDomain={[-180, 180]}
						xDomain={[
							imuChartData.at(0)?.t,
							Number(imuChartData.at(-1)?.t) < 200
								? 200
								: imuChartData.at(-1)?.t,
						]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</LineChart>
				</Chart.Container>
			</div>
		</div>
		<div class="flex">
			<div class="w-10 flex justify-center items-center">
				<p class="rotate-90">Roll</p>
			</div>
			<div class="flex-1">
				<Chart.Container config={chartConfig}>
					<LineChart
						data={imuChartData}
						x="t"
						axis="x"
						series={imuYSeries}
						props={{
							highlight: { points: { r: 4 } },
						}}
						yDomain={[-180, 180]}
						xDomain={[
							imuChartData.at(0)?.t,
							Number(imuChartData.at(-1)?.t) < 200
								? 200
								: imuChartData.at(-1)?.t,
						]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</LineChart>
				</Chart.Container>
			</div>
		</div>
		<div class="flex">
			<div class="w-10 flex justify-center items-center">
				<p class="rotate-90">Yaw</p>
			</div>
			<div class="flex-1">
				<Chart.Container config={chartConfig}>
					<LineChart
						data={imuChartData}
						x="t"
						axis="x"
						series={imuZSeries}
						props={{
							highlight: { points: { r: 4 } },
						}}
						yDomain={[-180, 180]}
						xDomain={[
							imuChartData.at(0)?.t,
							Number(imuChartData.at(-1)?.t) < 200
								? 200
								: imuChartData.at(-1)?.t,
						]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</LineChart>
				</Chart.Container>
			</div>
		</div>
	</Tabs.Content>
</Tabs.Root>
