<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tabs from "$lib/components/ui/tabs";
	import { API_ADDRESS, WS_API_ADDRESS } from "$src/config";
	import { LineChart } from "layerchart";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { onMount } from "svelte";
	import { formatSize, numberIsValid, radToDeg, sleep } from "$lib/utils";
	import Spinner from "$lib/components/ui/spinner/spinner.svelte";
	import ChartLegend from "./data-tab/chart-legend.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	let streamSocket: WebSocket | null = null;
	let logSocket: WebSocket | null = null;
	let logMessages: string[] = $state([]);

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
		tasks?: Record<string, { cpu: number; minFreeStack: number; stackSize?: number }>;
		motor?: {
			leftPosition: number;
			rightPosition: number;
			leftVelocity?: number;
			rightVelocity?: number;
		};
		espHeap?: ReceivedHeapDataType;
		microseconds: number;
		x?: number;
		y?: number;
		z?: number;
		position0?: number;
		position1?: number;
		velocity0?: number;
		velocity1?: number;
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

	type DataTab =  "esp-task-data" | "imu" | "motor" | "logs";

	let stmTaskTableData: TaskTableData[] = $state([]);
	let espTaskTableData: TaskTableData[] = $state([]);

	let dataTab: DataTab = $state("esp-task-data");

	let imuChartData: ImuChartData[] = $state([]);
	let motorChartData: MotorChartData[] = $state([]);
	let heapChartData: HeapChartDataType[] = $state([]);
	let stmTaskStackSizes: StackSizeResponse = $state({});
	let espTaskStackSizes: StackSizeResponse = $state({});
	let espStackSizesLoading = true;
	let stmStackSizesLoading = true;
	let timeOffset = 0;
	let setTimeOffset = true;

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

	const updateTaskTable = (
		taskTableData: TaskTableData[],
		receivedTaskData: Record<string, ReceivedEspTaskDataType>,
		stackSizes: Record<string, number>,
	) => {
		let newTaskTableData = taskTableData.map((row) => ({ ...row }));
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
			(serviceStatus) => serviceStatus.absentCounter < 1,
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

	const formatChartValue = (value: unknown, suffix = "") => {
		const numericValue = Number(value);
		if (!Number.isFinite(numericValue)) {
			return "N/A";
		}
		return `${numericValue.toFixed(1)}${suffix}`;
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

	const closeStreamSocket = () => {
		if (streamSocket) {
			streamSocket.close();
			streamSocket = null;
		}
	};

	const closeLogSocket = () => {
		if (logSocket) {
			logSocket.close();
			logSocket = null;
		}
	};

	const connectLogStream = () => {
		closeLogSocket();
		logSocket = new WebSocket(`${WS_API_ADDRESS}/api/log/system`);
		logSocket.onmessage = (event) => {
			const text = String(event.data ?? "").trim();
			if (!text) {
				return;
			}
			logMessages = [...logMessages.slice(-199), text];
		};
	};

	const connectDataStream = () => {
		closeStreamSocket();
		const streamName = dataTab === "esp-task-data" ? "tasks" : dataTab;
		streamSocket = new WebSocket(`${WS_API_ADDRESS}/api/stream/${streamName}`);
		streamSocket.onmessage = (event) => {
			const data: WsData = JSON.parse(event.data);
			const normalizedTasks = Object.fromEntries(
				Object.entries(data.tasks ?? {}).map(([name, task]) => [
					name,
					{
						cpuUsage: task.cpu,
						minFreeStack: task.minFreeStack,
						stackSize: task.stackSize,
					},
				]),
			) as Record<string, ReceivedEspTaskDataType>;
			const stmTaskData = data.stmCpuUsage;
			const espTaskData = normalizedTasks;
			if (espTaskData) {
				delete espTaskData["IDLE0"];
				delete espTaskData["IDLE1"];
			}
			const imuData =
				data.imu ??
				((data.x !== undefined || data.y !== undefined || data.z !== undefined)
					? {
							x: data.x ?? 0,
							y: data.y ?? 0,
							z: data.z ?? 0,
						}
					: undefined);
			const motorData =
				data.motor ??
				((data.position0 !== undefined || data.position1 !== undefined)
					? {
							leftPosition: data.position0 ?? 0,
							rightPosition: data.position1 ?? 0,
							leftVelocity: data.velocity0 ?? 0,
							rightVelocity: data.velocity1 ?? 0,
						}
					: undefined);
			const heapData = data.espHeap;
			if (setTimeOffset) {
				timeOffset = data.microseconds;
				setTimeOffset = false;
			}
			const t = data.microseconds - timeOffset;
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
	};

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

	const onDataTabChange = (nextDataTab: string) => {
		dataTab = nextDataTab as DataTab;
		setTimeOffset = true;
		connectDataStream();
	};

	onMount(() => {
		connectDataStream();
		connectLogStream();
		return () => {
			closeStreamSocket();
			closeLogSocket();
		};
	});
</script>

<Tabs.Root
	bind:value={dataTab}
	class="h-full overflow-hidden gap-0"
	onValueChange={onDataTabChange}
>
	<Tabs.List class="w-full rounded-none min-h-20">
		<Tabs.Trigger class="flex flex-col" value="esp-task-data"
			>Tasks</Tabs.Trigger
		>
		<Tabs.Trigger class="flex flex-col" value="imu">IMU</Tabs.Trigger>
		<Tabs.Trigger class="flex flex-col" value="motor">Motor</Tabs.Trigger>
		<Tabs.Trigger class="flex flex-col" value="logs">Logs</Tabs.Trigger>
	</Tabs.List>

	<div class="overflow-y-auto h-full">
		<Tabs.Content value="esp-task-data" class="overflow-hidden h-full">
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
				<Separator />
				<div class="p-4">
					<ChartLegend
						series={heapSeries}
						values={heapChartData?.at(-1)
							? Object.fromEntries(
									Object.entries(heapChartData.at(-1) ?? {})
										.filter(([k]) => k !== "t")
										.map(([k, v]) => [k, formatSize(Number(v))]),
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
		</Tabs.Content>
		<Tabs.Content
			value="imu"
			class="overflow-y-auto flex-1 flex flex-col gap-4 p-4"
		>
			<ChartLegend
				series={imuSeries}
				values={imuChartData?.at(-1)
					? Object.fromEntries(
							Object.entries(imuChartData.at(-1) ?? {})
								.filter(([k]) => k !== "t")
								.map(([k, v]) => [k, formatChartValue(v, " deg")]),
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
								Object.entries(motorChartData.at(-1) ?? {})
									.filter(([k]) => k !== "t")
									.map(([k, v]) => [k, formatChartValue(v, " deg")]),
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
		<Tabs.Content value="logs" class="overflow-hidden h-full p-4">
			<div class="h-full rounded-md border bg-background p-3 overflow-auto font-mono text-xs">
				{#if logMessages.length === 0}
					<div class="text-muted-foreground">Waiting for logs...</div>
				{:else}
					{#each logMessages as logLine}
						<div class="whitespace-pre-wrap break-words">{logLine}</div>
					{/each}
				{/if}
			</div>
		</Tabs.Content>
	</div>
</Tabs.Root>
