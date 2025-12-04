import { Client, cacheExchange, fetchExchange } from "@urql/svelte";

export const client = new Client({
  url: import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT || "http://localhost:8080/v1/graphql",
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: false,
  requestPolicy: "network-only",
  fetchOptions: () => {
    const secret = import.meta.env.VITE_HASURA_ADMIN_SECRET;
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-hasura-admin-secret": secret } : {}),
      },
    };
  },
});
