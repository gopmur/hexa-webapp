import { persistentStore } from "$lib/utils";

export const settings = persistentStore("settings", {
	advanced: false,
});