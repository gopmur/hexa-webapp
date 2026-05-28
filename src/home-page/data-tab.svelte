<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tabs from "$lib/components/ui/tabs";
	import { API_ADDRESS } from "$src/config";
	import { LineChart } from "layerchart";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { onMount } from "svelte";
	import { formatSize, numberIsValid, radToDeg, sleep } from "$lib/utils";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import ChartLegend from "./data-tab/chart-legend.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import { getWebSocket } from "$src/context/ws";

	export let readDataStream: boolean = false;
	const ws = getWebSocket();

	type ReceivedEspTaskDataType = {
		cpuUsage: number;
		minFreeStack: number;
		stackSize?: number;
	};

	type ReceivedStmTaskDataType = {
		cpuUsage: number;
		minFreeStack: number;
		stackSize?: number;
	};

	type ReceivedHeapDataType = {
		free: number;
		minFree: number;
		totalSize: number;
		largestBlock: number;
	};

	type WsData = {
		imu?: {
			x: number;
			y: number;
			z: number;
		};
		stmCpuUsage?: Record<string, ReceivedStmTaskDataType>;
		espCpuUsage?: Record<string, ReceivedEspTaskDataType>;
		motor?: {
			leftPosition: number;
			rightPosition: number;
		};
		espHeap?: ReceivedHeapDataType;
		microseconds: number;
	};

	type TaskTableData = {
		name: string;
		cpuUsage: number;
		minFreeStack: number;
		maxStackUsage?: number;
		maxStackUsagePercent?: number;
		stackSize?: number;
		absentCounter: number;
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

	type HeapChartDataType = ReceivedHeapDataType & { t: number };

	type MotorData = {
		rightPosition: number;
		leftPosition: number;
	};

	type MotorChartData = {
		t: number;
		rightPosition: number;
		leftPosition: number;
	};

	type StackSizeResponse = Record<string, number>;

	type DataTab = "stm-task-data" | "esp-task-data" | "imu" | "motor";

	let stmTaskTableData: TaskTableData[] = [];
	let espTaskTableData: TaskTableData[] = [];

	let dataTab: DataTab = "stm-task-data";

	let imuChartData: ImuChartData[] = [];
	let motorChartData: MotorChartData[] = [];
	let heapChartData: HeapChartDataType[] = [];
	let stmTaskStackSizes: StackSizeResponse;
	let espTaskStackSizes: StackSizeResponse;
	let espStackSizesLoading = true;
	let stmStackSizesLoading = true;

	const MAX_T_SPAN = 5_000_000;

	const appendDataPointToChartData = (
		dataPoint: object,
		t: number,
		chartData: Array<object & { t: number }>,
	) => {
		const newPoint = {
			t,
			...dataPoint,
		};
		chartData.push(newPoint);
		if (Number(chartData.at(-1)?.t) - Number(chartData.at(0)?.t) > MAX_T_SPAN) {
			const diff =
				Number(chartData.at(-1)?.t) - Number(chartData.at(0)?.t) - MAX_T_SPAN;
			let i = 0;
			let start = Number(chartData.at(0)?.t);
			for (i = 1; i < chartData.length; i++) {
				if (chartData[i].t - start >= diff) {
					break;
				}
			}
			return chartData.slice(i);
		}
		return chartData;
	};

	const getStmStackSizes = async () => {
		stmStackSizesLoading = true;
		while (true) {
			try {
				let stm_response = await fetch(`${API_ADDRESS}/api/stm_stack_size`);
				stmTaskStackSizes = await stm_response.json();
				break;
			} catch {
				await sleep(1000);
			}
		}
		stmStackSizesLoading = false;
	};

	const getEspStackSizes = async () => {
		espStackSizesLoading = true;
		while (true) {
			try {
				let esp_response = await fetch(`${API_ADDRESS}/api/esp_stack_size`);
				espTaskStackSizes = await esp_response.json();
				break;
			} catch {
				await sleep(1000);
			}
		}
		espStackSizesLoading = false;
	};

	getStmStackSizes();
	getEspStackSizes();

	const updateTaskTable = (
		taskTableData: TaskTableData[],
		receivedTaskData: Record<string, ReceivedEspTaskDataType>,
		stackSizes: Record<string, number>,
	) => {
		let newTaskTableData = structuredClone(taskTableData);
		receivedTaskData = Object.fromEntries(
			Object.entries(receivedTaskData).filter(
				([name, taskData]) =>
					numberIsValid(taskData.cpuUsage) &&
					numberIsValid(taskData.minFreeStack) &&
					name != "main",
			),
		);
		for (const taskRecord of newTaskTableData) {
			taskRecord.absentCounter++;
		}
		newTaskTableData = newTaskTableData.filter(
			(serviceStatus) => serviceStatus.absentCounter < 10,
		);
		for (const name in receivedTaskData) {
			const serviceStatus = newTaskTableData.find(
				(serviceStatus) => serviceStatus.name == name,
			);
			const maxStackUsage = numberIsValid(stackSizes[name])
				? stackSizes[name] - receivedTaskData[name].minFreeStack
				: undefined;
			if (!serviceStatus) {
				newTaskTableData.push({
					name: name,
					cpuUsage: receivedTaskData[name].cpuUsage,
					minFreeStack: receivedTaskData[name].minFreeStack * 4,
					maxStackUsage: numberIsValid(maxStackUsage)
						? maxStackUsage * 4
						: undefined,
					stackSize: numberIsValid(stackSizes[name])
						? stackSizes[name] * 4
						: undefined,
					maxStackUsagePercent:
						stackSizes[name] && numberIsValid(maxStackUsage)
							? (maxStackUsage / stackSizes[name]) * 100
							: undefined,
					absentCounter: 0,
				});
			} else {
				serviceStatus.name = name;
				serviceStatus.cpuUsage = receivedTaskData[name].cpuUsage;
				serviceStatus.maxStackUsage = numberIsValid(maxStackUsage)
					? maxStackUsage * 4
					: undefined;
				serviceStatus.stackSize = numberIsValid(stackSizes[name])
					? stackSizes[name] * 4
					: undefined;
				serviceStatus.absentCounter = 0;
				serviceStatus.maxStackUsagePercent =
					stackSizes[name] && numberIsValid(maxStackUsage)
						? (maxStackUsage / stackSizes[name]) * 100
						: undefined;
			}
		}

		const totalRecordIndex = newTaskTableData.findIndex(
			(serviceStatus) => serviceStatus.name == "total",
		);
		if (totalRecordIndex >= 0) {
			newTaskTableData.splice(totalRecordIndex, 1);
		}

		const newTotal = newTaskTableData.reduce(
			(acc, curr) => {
				return {
					name: "total",
					cpuUsage: acc.cpuUsage + curr.cpuUsage,
					maxStackUsage:
						acc.maxStackUsage! +
						(numberIsValid(curr.maxStackUsage) ? curr.maxStackUsage : 0),
					minFreeStack: acc.minFreeStack + curr.minFreeStack,
					stackSize:
						acc.stackSize! +
						(numberIsValid(curr.stackSize) ? curr.stackSize : 0),
					absentCounter: 0,
					maxStackUsagePercent: 0,
				};
			},
			{
				name: "total",
				cpuUsage: 0,
				maxStackUsage: 0,
				stackSize: 0,
				absentCounter: 0,
				maxStackUsagePercent: 0,
				minFreeStack: 0,
			},
		);

		newTotal.maxStackUsagePercent =
			(newTotal.maxStackUsage! / newTotal.stackSize!) * 100;

		newTaskTableData.push(newTotal);
		return newTaskTableData;
	};

	const percentToLightness = (percent: number) => {
		percent = Math.min(percent, 100);
		const x = percent / 100;
		const y = x;
		const lightness = y * 1;
		return lightness;
	};

	const formatMemorySize = (size: number) => {
		if (size > 2 ** 20) {
			return `${(size / 2 ** 20).toFixed(1)}MB`;
		}
		if (size > 2 ** 10) {
			return `${(size / 2 ** 10).toFixed(1)}KB`;
		} else {
			return `${size}B`;
		}
	};

	$: if (readDataStream) {
		imuChartData = [];
		motorChartData = [];
		heapChartData = [];
		if (dataTab == "esp-task-data") {
			fetch(`${API_ADDRESS}/api/streams/start/esp_cpu_usage`);
		}
		if (dataTab == "stm-task-data") {
			fetch(`${API_ADDRESS}/api/streams/start/stm_cpu_usage`);
		}
		if (dataTab == "imu") {
			fetch(`${API_ADDRESS}/api/streams/start/imu`);
		}
		if (dataTab == "motor") {
			fetch(`${API_ADDRESS}/api/streams/start/motor`);
		}
	} else {
		fetch(`${API_ADDRESS}/api/streams/stop/imu`);
		fetch(`${API_ADDRESS}/api/streams/stop/stm_cpu_usage`);
		fetch(`${API_ADDRESS}/api/streams/stop/esp_cpu_usage`);
		fetch(`${API_ADDRESS}/api/streams/stop/motor`);
	}

	const imuChartColors = {
		x: "var(--warning)",
		y: "var(--chart-2)",
		z: "var(--destructive)",
	};

	const heapChartColors = {
		free: "var(--warning)",
		minFree: "var(--chart-2)",
		largestBlock: "var(--destructive)",
	};

	const motorChartColors = {
		leftPosition: "var(--warning)",
		rightPosition: "var(--chart-2)",
	};

	let imuSeries = [
		{
			key: "x",
			label: "x",
			color: imuChartColors.x,
		},
		{
			key: "y",
			label: "y",
			color: imuChartColors.y,
		},
		{
			key: "z",
			label: "z",
			color: imuChartColors.z,
		},
	];
	const motorSeries = [
		{
			key: "leftPosition",
			label: "Left position",
			color: motorChartColors.leftPosition,
		},
		{
			key: "rightPosition",
			label: "Right position",
			color: motorChartColors.rightPosition,
		},
	];

	const heapSeries = [
		{
			key: "free",
			label: "Free",
			color: heapChartColors.free,
		},
		{
			key: "minFree",
			label: "Minimum free",
			color: heapChartColors.minFree,
		},
		{
			key: "largestBlock",
			label: "Largest block",
			color: heapChartColors.largestBlock,
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
		fetch(
			`${API_ADDRESS}/api/streams/${dataTab == "motor" ? "start" : "stop"}/motor`,
		);
	};

	onMount(() => {
		ws.onmessage = (event) => {
			const data: WsData = JSON.parse(event.data);
			const stmTaskData = data.stmCpuUsage;
			const espTaskData = data.espCpuUsage;
			const imuData = data.imu;
			const motorData = data.motor;
			const heapData = data.espHeap;
			const t = data.microseconds;
			if (motorData) {
				motorData.leftPosition = radToDeg(motorData.leftPosition);
				motorData.rightPosition = radToDeg(motorData.rightPosition);
			}
			if (heapData)
				heapChartData = appendDataPointToChartData(
					heapData,
					t,
					heapChartData,
				) as HeapChartDataType[];
			if (imuData)
				imuChartData = appendDataPointToChartData(
					imuData,
					t,
					imuChartData,
				) as ImuChartData[];
			if (motorData)
				motorChartData = appendDataPointToChartData(
					motorData,
					t,
					motorChartData,
				) as MotorChartData[];
			if (stmTaskData) {
				stmTaskTableData = updateTaskTable(
					stmTaskTableData,
					stmTaskData,
					stmTaskStackSizes,
				);
			}
			if (espTaskData) {
				for (const task_name in espTaskData) {
					if (espTaskData[task_name].stackSize) {
						espTaskStackSizes[task_name] = espTaskData[task_name].stackSize;
					}
				}
				espTaskTableData = updateTaskTable(
					espTaskTableData,
					espTaskData,
					espTaskStackSizes,
				);
			}
		};
		return async () => {
			fetch(`${API_ADDRESS}/api/streams/stop/imu`);
			fetch(`${API_ADDRESS}/api/streams/stop/stm_cpu_usage`);
			fetch(`${API_ADDRESS}/api/streams/stop/esp_cpu_usage`);
			fetch(`${API_ADDRESS}/api/streams/stop/motor`);
		};
	});
</script>

<Tabs.Root
	bind:value={dataTab}
	class="h-full overflow-hidden gap-0"
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
		<Tabs.Trigger class="flex flex-col" value="motor">Motor</Tabs.Trigger>
	</Tabs.List>

	<div class="overflow-y-auto h-full">
		<Tabs.Content value="stm-task-data" class="h-full">
			{#if stmStackSizesLoading}
				<div class="h-full w-full flex items-center justify-center">
					<Spinner class="size-40" />
				</div>
			{:else}
				<Table.Root class="[&_tr]:hover:bg-background [&_thead]:sticky">
					<Table.Header class="">
						<Table.Row>
							<Table.Head>Service</Table.Head>
							<Table.Head>CPU Usage</Table.Head>
							<Table.Head>Stack (%)</Table.Head>
							<Table.Head class="max-sm:hidden">Stack Used</Table.Head>
							<Table.Head>Stack Free</Table.Head>
							<Table.Head class="max-sm:hidden">Stack Size</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each stmTaskTableData as serviceStatus (serviceStatus)}
							<Table.Row>
								<Table.Cell class="font-medium">{serviceStatus.name}</Table.Cell
								>
								<Table.Cell
									style={`background-color: oklch(0.795 0.184 86.047/ ${percentToLightness(serviceStatus.cpuUsage)});`}
									>{serviceStatus.cpuUsage?.toFixed(1)}%</Table.Cell
								>
								<Table.Cell
									style={`background-color: oklch(0.795 0.184 86.047/ ${serviceStatus.maxStackUsagePercent ? percentToLightness(serviceStatus.maxStackUsagePercent) : 0});`}
								>
									{numberIsValid(serviceStatus.maxStackUsagePercent)
										? `${serviceStatus.maxStackUsagePercent.toFixed(2)}%`
										: "NA"}
								</Table.Cell>
								<Table.Cell class="max-sm:hidden">
									{numberIsValid(serviceStatus.maxStackUsage)
										? formatMemorySize(serviceStatus.maxStackUsage)
										: "NA"}
								</Table.Cell>
								<Table.Cell>
									{formatMemorySize(serviceStatus.minFreeStack)}
								</Table.Cell>
								<Table.Cell class="max-sm:hidden">
									{numberIsValid(serviceStatus.stackSize)
										? formatMemorySize(serviceStatus.stackSize)
										: "NA"}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>
		<Tabs.Content value="esp-task-data" class="overflow-hidden h-full">
			{#if espStackSizesLoading}
				<div class="h-full w-full flex items-center justify-center">
					<div class="flex flex-col gap-4 items-center">
						<Spinner class="size-40" />
					</div>
				</div>
			{:else}
				<div class="h-full overflow-auto">
					<Table.Root class="[&_tr]:hover:bg-background">
						<Table.Header>
							<Table.Row>
								<Table.Head>Service</Table.Head>
								<Table.Head>CPU Usage</Table.Head>
								<Table.Head>Stack (%)</Table.Head>
								<Table.Head class="max-sm:hidden">Stack Used</Table.Head>
								<Table.Head>Stack Free</Table.Head>
								<Table.Head class="max-sm:hidden">Stack Size</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each espTaskTableData as serviceStatus (serviceStatus)}
								<Table.Row>
									<Table.Cell class="font-medium"
										>{serviceStatus.name}</Table.Cell
									>
									<Table.Cell
										style={`background-color: oklch(0.795 0.184 86.047/ ${percentToLightness(serviceStatus.cpuUsage)});`}
										>{serviceStatus.cpuUsage?.toFixed(1)}%</Table.Cell
									>
									<Table.Cell
										style={`background-color: oklch(0.795 0.184 86.047/ ${serviceStatus.maxStackUsagePercent ? percentToLightness(serviceStatus.maxStackUsagePercent) : 0});`}
									>
										{numberIsValid(serviceStatus.maxStackUsagePercent)
											? `${serviceStatus.maxStackUsagePercent.toFixed(2)}%`
											: "NA"}
									</Table.Cell>
									<Table.Cell class="max-sm:hidden">
										{numberIsValid(serviceStatus.maxStackUsage)
											? formatMemorySize(serviceStatus.maxStackUsage)
											: "NA"}
									</Table.Cell>
									<Table.Cell>
										{formatMemorySize(serviceStatus.minFreeStack)}
									</Table.Cell>
									<Table.Cell class="max-sm:hidden">
										{numberIsValid(serviceStatus.stackSize)
											? formatMemorySize(serviceStatus.stackSize)
											: "NA"}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
					<Separator />
					<div class="p-4">
						<ChartLegend
							series={heapSeries}
							values={heapChartData?.at(-1)
								? Object.fromEntries(
										Object.entries(heapChartData.at(-1) ?? {}).map(([k, v]) => [
											k,
											formatSize(v),
										]),
									)
								: undefined}
						/>
						<Chart.Container config={chartConfig}>
							<LineChart
								data={heapChartData}
								x="t"
								axis="x"
								series={heapSeries}
								props={{
									highlight: { points: false },
									xAxis: {
										format: (d) => String(d / 1_000_000),
									},
								}}
								xDomain={[
									heapChartData.at(0)?.t,
									Number(heapChartData.at(0)?.t) + MAX_T_SPAN,
								]}
							></LineChart>
						</Chart.Container>
					</div>
				</div>
			{/if}
		</Tabs.Content>
		<Tabs.Content
			value="imu"
			class="overflow-y-auto flex-1 flex flex-col gap-4 p-4"
		>
			<ChartLegend
				series={imuSeries}
				values={imuChartData?.at(-1)
					? Object.fromEntries(
							Object.entries(imuChartData.at(-1) ?? {}).map(([k, v]) => [
								k,
								`${v.toFixed(1)} deg`,
							]),
						)
					: undefined}
			/>
			<Chart.Container config={chartConfig}>
				<LineChart
					data={imuChartData}
					x="t"
					axis="x"
					series={imuSeries}
					props={{
						highlight: { points: false },
						xAxis: {
							format: (d) => String(d / 1_000_000),
						},
					}}
					yDomain={[-180, 180]}
					xDomain={[
						imuChartData.at(0)?.t,
						Number(imuChartData.at(0)?.t) + MAX_T_SPAN,
					]}
				></LineChart>
			</Chart.Container>
		</Tabs.Content>
		<Tabs.Content
			value="motor"
			class="overflow-y-auto flex-1 flex flex-col gap-4 p-4"
		>
			<div class="flex flex-col gap-1">
				<ChartLegend
					series={motorSeries}
					values={motorChartData?.at(-1)
						? Object.fromEntries(
								Object.entries(motorChartData.at(-1) ?? {}).map(([k, v]) => [
									k,
									`${v.toFixed(1)} deg`,
								]),
							)
						: undefined}
				/>
				<Chart.Container config={chartConfig}>
					<LineChart
						data={motorChartData}
						x="t"
						axis="x"
						series={motorSeries}
						props={{
							highlight: { points: false },
							xAxis: {
								format: (d) => String(d / 1_000_000),
							},
						}}
						yDomain={[-90, 180]}
						xDomain={[
							motorChartData.at(0)?.t,
							Number(motorChartData.at(0)?.t) + MAX_T_SPAN,
						]}
					></LineChart>
				</Chart.Container>
			</div>
		</Tabs.Content>
	</div>
</Tabs.Root>
