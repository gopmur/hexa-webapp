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
	import Button from "$lib/components/ui/button/button.svelte";
	import { ArrowDownToLine, Pause } from "lucide-svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-svelte";

	let streamSockets: WebSocket[] = [];
	let logSocket: WebSocket | null = null;
	let logMessages: string[] = $state([]);
	let logConnectionState = $state("Disconnected");
	let logScrollElement: HTMLDivElement | null = $state(null);
	let autoScrollLogs = $state(true);
	let { dashboard = false }: { dashboard?: boolean } = $props();
	type TaskSortKey = "name" | "state" | "currentPriority" | "basePriority" | "cpuUsage" | "maxStackUsagePercent" | "maxStackUsage" | "minFreeStack" | "stackSize";
	let taskSortKey: TaskSortKey = $state("name");
	let taskSortDirection: "asc" | "desc" = $state("desc");

	type ReceivedEspTaskDataType = {
		cpuUsage: number;
		minFreeStack: number;
		stackSize?: number;
		state?: string;
		currentPriority?: number;
		basePriority?: number;
	};

	type ReceivedStmTaskDataType = {
		cpuUsage: number;
		minFreeStack: number;
		stackSize?: number;
		state?: string;
		currentPriority?: number;
		basePriority?: number;
	};

	type ReceivedHeapDataType = {
		free: number;
		minFree: number;
		totalSize: number;
		largestBlock: number;
	};

	type ImuVector = {
		x: number;
		y: number;
		z: number;
	};

	type ImuPayload = ImuVector | { accel?: ImuVector; gyro?: ImuVector };

	type MotorFeedback = {
		position: number;
		velocity: number;
		torque: number;
	};

	type WsData = {
		imu?: ImuPayload;
		accel?: ImuVector;
		gyro?: ImuVector;
		stmCpuUsage?: Record<string, ReceivedStmTaskDataType>;
		espCpuUsage?: Record<string, ReceivedEspTaskDataType>;
		tasks?: Record<string, {
			cpu: number;
			minFreeStack: number;
			stackSize?: number;
			state?: string;
			currentPriority?: number;
			basePriority?: number;
		}>;
		motor?: {
			leftPosition: number;
			rightPosition: number;
			leftVelocity?: number;
			rightVelocity?: number;
		};
		feedbacks?: MotorFeedback[];
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
		state?: string;
		currentPriority?: number;
		basePriority?: number;
		absentCounter: number;
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
	let accelChartData: ImuChartData[] = $state([]);
	let motorChartData: MotorChartData[] = $state([]);
	let heapChartData: HeapChartDataType[] = $state([]);
	let stmTaskStackSizes: StackSizeResponse = $state({});
	let espTaskStackSizes: StackSizeResponse = $state({});
	let espStackSizesLoading = true;
	let stmStackSizesLoading = true;
	let timeOffset = 0;
	let setTimeOffset = true;
	const TASK_MISSING_GRACE_PACKETS = 50;
	const sortedTaskTableData = $derived.by(() =>
		[...espTaskTableData].sort((left, right) => {
			if (left.name === "total") return right.name === "total" ? 0 : -1;
			if (right.name === "total") return 1;
			const leftValue = left[taskSortKey];
			const rightValue = right[taskSortKey];
			if (leftValue === undefined || rightValue === undefined) {
				return leftValue === rightValue ? 0 : leftValue === undefined ? 1 : -1;
			}
			const comparison =
				typeof leftValue === "string" && typeof rightValue === "string"
					? leftValue.localeCompare(rightValue)
					: Number(leftValue) - Number(rightValue);
			return taskSortDirection === "asc" ? comparison : -comparison;
		}),
	);

	const sortTasksBy = (key: TaskSortKey) => {
		if (taskSortKey === key) {
			taskSortDirection = taskSortDirection === "asc" ? "desc" : "asc";
			return;
		}
		taskSortKey = key;
		taskSortDirection = key === "name" ? "asc" : "desc";
	};

	const sortIcon = (key: TaskSortKey) => {
		if (taskSortKey !== key) return ArrowDownUp;
		return taskSortDirection === "asc" ? ArrowUp : ArrowDown;
	};

	$effect(() => {
		logMessages.length;
		if (autoScrollLogs && logScrollElement) {
			logScrollElement.scrollTop = logScrollElement.scrollHeight;
		}
	});

	const MAX_T_SPAN = 5_000_000;

	const appendDataPointToChartData = (
		dataPoint: object,
		t: number,
		chartData: Array<object & { t: number }>,
	) => {
		if (
			!Number.isFinite(t) ||
			!Object.values(dataPoint).every(
				(value) => typeof value === "number" && Number.isFinite(value),
			)
		) {
			return chartData;
		}
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
			(serviceStatus) => serviceStatus.absentCounter <= TASK_MISSING_GRACE_PACKETS,
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
					state: receivedTaskData[name].state,
					currentPriority: receivedTaskData[name].currentPriority,
					basePriority: receivedTaskData[name].basePriority,
					absentCounter: 0,
				});
			} else {
				serviceStatus.name = name;
				serviceStatus.cpuUsage = receivedTaskData[name].cpuUsage;
				serviceStatus.state = receivedTaskData[name].state;
				serviceStatus.currentPriority = receivedTaskData[name].currentPriority;
				serviceStatus.basePriority = receivedTaskData[name].basePriority;
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
		for (const socket of streamSockets) socket.close();
		streamSockets = [];
	};

	const closeLogSocket = () => {
		if (logSocket) {
			logSocket.close();
			logSocket = null;
		}
	};

	const connectLogStream = () => {
		closeLogSocket();
		logConnectionState = "Connecting to system logs...";
		logSocket = new WebSocket(`${WS_API_ADDRESS}/api/log/system`);
		logSocket.onopen = () => {
			logConnectionState = "Connected; waiting for system logs...";
		};
		logSocket.onmessage = (event) => {
			const text = String(event.data ?? "")
				.replace(/\u001b\[[0-9;]*m/g, "")
				.trimEnd();
			if (!text) {
				return;
			}
			logMessages = [...logMessages.slice(-199), text];
			logConnectionState = "Connected";
		};
		logSocket.onerror = () => {
			logConnectionState = "System log connection failed";
		};
		logSocket.onclose = () => {
			logConnectionState = "System log connection closed";
		};
	};

	const connectDataStream = (requestedStreamName?: string) => {
		const streamName = requestedStreamName ?? (dataTab === "esp-task-data" ? "tasks" : dataTab);
		const socket = new WebSocket(`${WS_API_ADDRESS}/api/stream/${streamName}`);
		streamSockets.push(socket);
		socket.onmessage = (event) => {
			const data: WsData = JSON.parse(event.data);
			if (!Number.isFinite(data.microseconds)) {
				return;
			}
			const rootTaskRecords: Record<
				string,
				{
					cpu: number;
					minFreeStack: number;
					stackSize?: number;
					state?: string;
					currentPriority?: number;
					basePriority?: number;
				}
			> = {};
			for (const [name, task] of Object.entries(data)) {
				if (
					name !== "microseconds" &&
					!name.startsWith("IDLE") &&
					typeof task === "object" &&
					task !== null &&
					"cpu" in task &&
					typeof task.cpu === "number" &&
					"minFreeStack" in task &&
					typeof task.minFreeStack === "number"
				) {
					rootTaskRecords[name] = {
						cpu: task.cpu,
						minFreeStack: task.minFreeStack,
						stackSize:
							"stackSize" in task && typeof task.stackSize === "number"
								? task.stackSize
								: undefined,
						state: "state" in task && typeof task.state === "string" ? task.state : undefined,
						currentPriority:
							"currentPriority" in task && typeof task.currentPriority === "number"
								? task.currentPriority
								: undefined,
						basePriority:
							"basePriority" in task && typeof task.basePriority === "number"
								? task.basePriority
								: undefined,
					};
				}
			}
			const taskRecords = data.tasks ?? rootTaskRecords;
			const hasEspTaskData = data.tasks !== undefined || Object.keys(rootTaskRecords).length > 0;
			const normalizedTasks = Object.fromEntries(
				Object.entries(taskRecords)
					.filter(([name]) => !name.startsWith("IDLE"))
					.map(([name, task]) => [
						name,
						{
							cpuUsage: task.cpu,
							minFreeStack: task.minFreeStack,
							stackSize: task.stackSize,
							state: task.state,
							currentPriority: task.currentPriority,
							basePriority: task.basePriority,
						},
					]),
			) as Record<string, ReceivedEspTaskDataType>;
			const stmTaskData = data.stmCpuUsage;
			const espTaskData = normalizedTasks;
			const imuPayload = data.imu;
			const legacyImuData = imuPayload && "x" in imuPayload ? imuPayload : undefined;
			const nestedImuData = imuPayload && !("x" in imuPayload) ? imuPayload : undefined;
			const gyroData =
				data.gyro ??
				nestedImuData?.gyro ??
				legacyImuData ??
				((data.x !== undefined || data.y !== undefined || data.z !== undefined)
					? { x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0 }
					: undefined);
			const accelData = data.accel ?? nestedImuData?.accel;
			const leftMotorFeedback = data.feedbacks?.[0];
			const rightMotorFeedback = data.feedbacks?.[1];
			const feedbackMotorData =
				leftMotorFeedback &&
				rightMotorFeedback &&
				Number.isFinite(leftMotorFeedback.position) &&
				Number.isFinite(rightMotorFeedback.position)
					? {
							leftPosition: leftMotorFeedback.position,
							rightPosition: rightMotorFeedback.position,
						}
					: undefined;
			const motorData =
				data.motor ??
				feedbackMotorData ??
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
			if (gyroData)
				imuChartData = appendDataPointToChartData(
					gyroData,
					t,
					imuChartData,
				) as ImuChartData[];
			if (accelData)
				accelChartData = appendDataPointToChartData(
					accelData,
					t,
					accelChartData,
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
			if (hasEspTaskData) {
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

	const accelChartColors = {
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

	const imuSeries = [
		{
			key: "x",
			label: "Gyro X",
			color: imuChartColors.x,
		},
		{
			key: "y",
			label: "Gyro Y",
			color: imuChartColors.y,
		},
		{
			key: "z",
			label: "Gyro Z",
			color: imuChartColors.z,
		},
	];
	const accelSeries = [
		{
			key: "x",
			label: "Accel X",
			color: accelChartColors.x,
		},
		{
			key: "y",
			label: "Accel Y",
			color: accelChartColors.y,
		},
		{
			key: "z",
			label: "Accel Z",
			color: accelChartColors.z,
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

	const logLevelClass = (line: string) => {
		const level = line.match(/^\s*\[?([EWIDV])(?:\]|\s|\()/)?.[1];
		if (level === "E") return "border-red-500 text-red-700 dark:text-red-300";
		if (level === "W") return "border-amber-500 text-amber-700 dark:text-amber-300";
		if (level === "I") return "border-emerald-500 text-emerald-700 dark:text-emerald-300";
		if (level === "D") return "border-cyan-500 text-cyan-700 dark:text-cyan-300";
		if (level === "V") return "border-zinc-400 text-zinc-600 dark:text-zinc-400";
		return "border-transparent text-foreground";
	};

	const onDataTabChange = (nextDataTab: string) => {
		dataTab = nextDataTab as DataTab;
		if (dataTab === "logs") {
			connectLogStream();
		} else {
			closeLogSocket();
		}
		imuChartData = [];
		accelChartData = [];
		motorChartData = [];
		heapChartData = [];
		timeOffset = 0;
		setTimeOffset = true;
		closeStreamSocket();
		if (dataTab !== "logs") connectDataStream();
	};

	onMount(() => {
		if (dashboard) {
			connectDataStream("tasks");
			connectDataStream("imu");
			connectDataStream("motor");
			connectLogStream();
		} else {
			connectDataStream();
		}
		return () => {
			closeStreamSocket();
			closeLogSocket();
		};
	});
</script>

{#if dashboard}
	<div class="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2 overflow-hidden p-2">
		<Card.Root class="min-h-0 min-w-0 gap-0 rounded-lg py-0">
			<header class="flex shrink-0 items-center justify-between border-b px-3 py-2">
				<h3 class="text-xs font-semibold">Task monitor</h3>
				<span class="text-[10px] text-muted-foreground">{sortedTaskTableData.length} active</span>
			</header>
			<div class="min-h-0 flex-1 overflow-auto">
				{#if sortedTaskTableData.length === 0}
					<p class="p-3 text-xs text-muted-foreground">Waiting for task telemetry...</p>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("name")}>Task {#key sortIcon("name")} {@const Icon = sortIcon("name")}<Icon class="ml-1 size-3" />{/key}</Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("state")}>Status {@const Icon = sortIcon("state")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("currentPriority")}>Priority {@const Icon = sortIcon("currentPriority")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("cpuUsage")}>CPU {@const Icon = sortIcon("cpuUsage")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("maxStackUsagePercent")}>Stack % {@const Icon = sortIcon("maxStackUsagePercent")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("maxStackUsage")}>Used {@const Icon = sortIcon("maxStackUsage")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("minFreeStack")}>Free {@const Icon = sortIcon("minFreeStack")}<Icon class="ml-1 size-3" /></Button></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each sortedTaskTableData as task (task.name)}
								<Table.Row>
									<Table.Cell class="font-medium">{task.name}</Table.Cell>
									<Table.Cell>{task.state ?? "-"}</Table.Cell>
									<Table.Cell>{task.currentPriority ?? "-"}/{task.basePriority ?? "-"}</Table.Cell>
									<Table.Cell
										style={`background-color: oklch(0.795 0.184 86.047 / ${percentToLightness(task.cpuUsage)});`}
									>
										{task.cpuUsage.toFixed(1)}%
									</Table.Cell>
									<Table.Cell
										style={`background-color: oklch(0.795 0.184 86.047 / ${numberIsValid(task.maxStackUsagePercent) ? percentToLightness(task.maxStackUsagePercent) : 0});`}
									>
										{numberIsValid(task.maxStackUsagePercent) ? `${task.maxStackUsagePercent.toFixed(1)}%` : "NA"}
									</Table.Cell>
									<Table.Cell
										style={`background-color: oklch(0.795 0.184 86.047 / ${numberIsValid(task.maxStackUsagePercent) ? percentToLightness(task.maxStackUsagePercent) : 0});`}
									>
										{numberIsValid(task.maxStackUsage)
											? formatMemorySize(task.maxStackUsage)
											: "NA"}
									</Table.Cell>
									<Table.Cell>{formatMemorySize(task.minFreeStack)}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</div>
		</Card.Root>
		<Card.Root class="flex min-h-0 min-w-0 flex-col gap-0 rounded-lg py-0">
			<header class="shrink-0 border-b px-3 py-2">
				<h3 class="text-xs font-semibold">IMU</h3>
			</header>
			<section class="flex min-h-0 flex-1 flex-col">
				<h4 class="px-3 pt-2 text-[10px] font-semibold">Gyroscope</h4>
				<ChartLegend
					series={imuSeries}
					values={imuChartData.at(-1)
						? Object.fromEntries(Object.entries(imuChartData.at(-1) ?? {}).filter(([key]) => key !== "t").map(([key, value]) => [key, formatChartValue(value, " deg/s")]))
						: undefined}
				/>
				{#if imuChartData.length > 0}
					<Chart.Container class="min-h-0 flex-1 aspect-auto" config={chartConfig}>
						<LineChart
							data={imuChartData}
							x="t"
							axis="x"
							series={imuSeries}
							props={{ highlight: { points: false }, xAxis: { format: (value) => String(value / 1_000_000) } }}
							yDomain={[-180, 180]}
							xDomain={[imuChartData[0].t, imuChartData[0].t + MAX_T_SPAN]}
						/>
					</Chart.Container>
				{:else}
					<p class="p-3 text-xs text-muted-foreground">Waiting for gyro telemetry...</p>
				{/if}
			</section>
			<section class="flex min-h-0 flex-1 flex-col border-t">
				<h4 class="px-3 pt-2 text-[10px] font-semibold">Acceleration</h4>
				<ChartLegend
					series={accelSeries}
					values={accelChartData.at(-1)
						? Object.fromEntries(Object.entries(accelChartData.at(-1) ?? {}).filter(([key]) => key !== "t").map(([key, value]) => [key, formatChartValue(value)]))
						: undefined}
				/>
				{#if accelChartData.length > 0}
					<Chart.Container class="min-h-0 flex-1 aspect-auto" config={chartConfig}>
						<LineChart
							data={accelChartData}
							x="t"
							axis="x"
							series={accelSeries}
							props={{ highlight: { points: false }, xAxis: { format: (value) => String(value / 1_000_000) } }}
							yDomain={[-2, 2]}
							xDomain={[accelChartData[0].t, accelChartData[0].t + MAX_T_SPAN]}
						/>
					</Chart.Container>
				{:else}
					<p class="p-3 text-xs text-muted-foreground">Waiting for acceleration telemetry...</p>
				{/if}
			</section>
		</Card.Root>
		<Card.Root class="flex min-h-0 min-w-0 flex-col gap-0 rounded-lg py-0">
			<header class="shrink-0 border-b px-3 py-2">
				<h3 class="text-xs font-semibold">Motor position</h3>
			</header>
			<ChartLegend
				series={motorSeries}
				values={motorChartData.at(-1)
					? Object.fromEntries(Object.entries(motorChartData.at(-1) ?? {}).filter(([key]) => key !== "t").map(([key, value]) => [key, formatChartValue(value, " deg")]))
					: undefined}
			/>
			{#if motorChartData.length > 0}
				<Chart.Container class="min-h-0 flex-1 aspect-auto" config={chartConfig}>
					<LineChart
						data={motorChartData}
						x="t"
						axis="x"
						series={motorSeries}
						props={{ highlight: { points: false }, xAxis: { format: (value) => String(value / 1_000_000) } }}
						yDomain={[-90, 180]}
						xDomain={[motorChartData[0].t, motorChartData[0].t + MAX_T_SPAN]}
					/>
				</Chart.Container>
			{:else}
				<p class="p-3 text-xs text-muted-foreground">Waiting for motor telemetry...</p>
			{/if}
		</Card.Root>
		<Card.Root class="flex min-h-0 min-w-0 flex-col gap-0 rounded-lg py-0">
			<header class="flex shrink-0 items-center justify-between border-b px-3 py-2">
				<h3 class="text-xs font-semibold">System log</h3>
				<div class="flex items-center gap-2">
					<span class="text-[10px] text-muted-foreground">{logConnectionState}</span>
					<Button
						variant="outline"
						size="sm"
						aria-pressed={autoScrollLogs}
						title={autoScrollLogs ? "Pause automatic scrolling" : "Resume automatic scrolling"}
						onclick={() => (autoScrollLogs = !autoScrollLogs)}
					>
						{#if autoScrollLogs}<ArrowDownToLine /> Auto-scroll{:else}<Pause /> Paused{/if}
					</Button>
				</div>
			</header>
			<div bind:this={logScrollElement} class="min-h-0 flex-1 space-y-1 overflow-auto p-3 font-mono text-[11px]">
				{#if logMessages.length === 0}
					<p class="text-muted-foreground">Waiting for system logs...</p>
				{:else}
					{#each logMessages as logLine, index (`${index}-${logLine}`)}
						<div class={`whitespace-pre-wrap break-words border-l-2 pl-2 ${logLevelClass(logLine)}`}>{logLine}</div>
					{/each}
				{/if}
			</div>
		</Card.Root>
	</div>
{:else}
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
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("name")}>Service {@const Icon = sortIcon("name")}<Icon class="ml-1 size-3" /></Button></Table.Head>
							<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("state")}>Status {@const Icon = sortIcon("state")}<Icon class="ml-1 size-3" /></Button></Table.Head>
							<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("currentPriority")}>Priority (current/base) {@const Icon = sortIcon("currentPriority")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("cpuUsage")}>CPU Usage {@const Icon = sortIcon("cpuUsage")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("maxStackUsagePercent")}>Stack (%) {@const Icon = sortIcon("maxStackUsagePercent")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head class="max-sm:hidden"><Button variant="ghost" size="sm" onclick={() => sortTasksBy("maxStackUsage")}>Stack Used {@const Icon = sortIcon("maxStackUsage")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head><Button variant="ghost" size="sm" onclick={() => sortTasksBy("minFreeStack")}>Stack Free {@const Icon = sortIcon("minFreeStack")}<Icon class="ml-1 size-3" /></Button></Table.Head>
								<Table.Head class="max-sm:hidden"><Button variant="ghost" size="sm" onclick={() => sortTasksBy("stackSize")}>Stack Size {@const Icon = sortIcon("stackSize")}<Icon class="ml-1 size-3" /></Button></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each sortedTaskTableData as serviceStatus (serviceStatus.name)}
							<Table.Row>
								<Table.Cell class="font-medium">{serviceStatus.name}</Table.Cell
								>
								<Table.Cell>{serviceStatus.state ?? "-"}</Table.Cell>
								<Table.Cell>{serviceStatus.currentPriority ?? "-"}/{serviceStatus.basePriority ?? "-"}</Table.Cell>
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
					{#if heapChartData.length > 0}
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
								heapChartData.at(0)?.t ?? 0,
								(heapChartData.at(0)?.t ?? 0) + MAX_T_SPAN,
							]}
						></LineChart>
					</Chart.Container>
					{/if}
				</div>
			</div>
		</Tabs.Content>
		<Tabs.Content
			value="imu"
			class="overflow-y-auto flex-1 flex flex-col gap-4 p-4"
		>
			<section class="flex min-h-64 flex-1 flex-col gap-2">
				<h3 class="text-sm font-semibold">Gyroscope</h3>
				<ChartLegend
					series={imuSeries}
					values={imuChartData.at(-1)
						? Object.fromEntries(Object.entries(imuChartData.at(-1) ?? {}).filter(([key]) => key !== "t").map(([key, value]) => [key, formatChartValue(value, " deg/s")]))
						: undefined}
				/>
				{#if imuChartData.length > 0}
					<Chart.Container class="min-h-0 flex-1" config={chartConfig}>
						<LineChart
							data={imuChartData}
							x="t"
							axis="x"
							series={imuSeries}
							props={{ highlight: { points: false }, xAxis: { format: (value) => String(value / 1_000_000) } }}
							yDomain={[-180, 180]}
							xDomain={[imuChartData[0].t, imuChartData[0].t + MAX_T_SPAN]}
						/>
					</Chart.Container>
				{:else}
					<p class="text-xs text-muted-foreground">Waiting for gyro telemetry...</p>
				{/if}
			</section>
			<section class="flex min-h-64 flex-1 flex-col gap-2 border-t pt-4">
				<h3 class="text-sm font-semibold">Acceleration</h3>
				<ChartLegend
					series={accelSeries}
					values={accelChartData.at(-1)
						? Object.fromEntries(Object.entries(accelChartData.at(-1) ?? {}).filter(([key]) => key !== "t").map(([key, value]) => [key, formatChartValue(value)]))
						: undefined}
				/>
				{#if accelChartData.length > 0}
					<Chart.Container class="min-h-0 flex-1" config={chartConfig}>
						<LineChart
							data={accelChartData}
							x="t"
							axis="x"
							series={accelSeries}
							props={{ highlight: { points: false }, xAxis: { format: (value) => String(value / 1_000_000) } }}
							yDomain={[-2, 2]}
							xDomain={[accelChartData[0].t, accelChartData[0].t + MAX_T_SPAN]}
						/>
					</Chart.Container>
				{:else}
					<p class="text-xs text-muted-foreground">Waiting for acceleration telemetry...</p>
				{/if}
			</section>
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
				{#if motorChartData.length > 0}
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
							motorChartData.at(0)?.t ?? 0,
							(motorChartData.at(0)?.t ?? 0) + MAX_T_SPAN,
						]}
					></LineChart>
				</Chart.Container>
				{/if}
			</div>
		</Tabs.Content>
		<Tabs.Content value="logs" class="overflow-hidden h-full p-4">
			<div class="flex h-full flex-col overflow-hidden rounded-md border bg-background font-mono text-xs">
				<div class="flex shrink-0 items-center justify-between border-b px-3 py-2">
					<span class="text-muted-foreground">{logConnectionState}</span>
					<Button
						variant="outline"
						size="sm"
						aria-pressed={autoScrollLogs}
						title={autoScrollLogs ? "Pause automatic scrolling" : "Resume automatic scrolling"}
						onclick={() => (autoScrollLogs = !autoScrollLogs)}
					>
						{#if autoScrollLogs}<ArrowDownToLine /> Auto-scroll{:else}<Pause /> Paused{/if}
					</Button>
				</div>
				<div bind:this={logScrollElement} class="min-h-0 flex-1 overflow-auto p-3">
				{#if logMessages.length === 0}
					<div class="text-muted-foreground">Waiting for system logs...</div>
				{:else}
					{#each logMessages as logLine, index (`${index}-${logLine}`)}
						<div class={`whitespace-pre-wrap break-words border-l-2 pl-2 ${logLevelClass(logLine)}`}>{logLine}</div>
					{/each}
				{/if}
				</div>
			</div>
		</Tabs.Content>
	</div>
</Tabs.Root>
{/if}
