import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), viteSingleFile(), tailwindcss()],
	resolve: {
		alias: {
			$lib: path.resolve("./src/lib"),
		},
	},
});
