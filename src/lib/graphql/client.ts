import { Client, cacheExchange, fetchExchange } from "@urql/svelte";

export const client = new Client({
  url: import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT || "http://localhost:8080/v1/graphql",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const secret = import.meta.env.VITE_HASURA_ADMIN_SECRET;
    return secret
      ? { headers: { "x-hasura-admin-secret": secret } }
      : {};
  },
});
