import { createAuthClient } from "better-auth/react";
import { adminClient, anonymousClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [anonymousClient(), usernameClient(), adminClient()],
});
