import { betterAuth } from "better-auth"

export const auth = betterAuth({
	baseURL: {
		allowedHosts: [
			"http://localhost:3000",
		],
	},
})
