import { query } from "./runtime";

export const get = query({
  handler: async () => {
    return "OK";
  },
});
