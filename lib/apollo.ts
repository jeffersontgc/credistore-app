import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/constants/Colors";

const httpLink = createHttpLink({
  uri: API_URL,
});

const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from storage if it exists
  const token = await SecureStore.getItemAsync("userToken");
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
