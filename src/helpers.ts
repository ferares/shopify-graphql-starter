import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs"

import { AdminApiClient, createAdminApiClient } from "@shopify/admin-api-client"

import { config } from "dotenv"

config({ quiet: true })

const { ACCESS_TOKEN, STORE_DOMAIN, API_VERSION } = process.env

const CACHE_PATH = "./cache/cache.json"
const LOG_PATH = "./logs/messages.log"

type GraphQLResponse<T> = { data: T, errors?: unknown }

/**
 * Singleton wrapper around Shopify's AdminApiClient.
 * Lazily initializes the client on first access and reuses it for all subsequent requests.
 * Access the client instance via `ShopifyApiClient.instance`.
 */
class ShopifyApiClient {
  static #instance: AdminApiClient

  private constructor() { }

  /**
   * Returns the shared AdminApiClient instance, creating it on first access.
   * Throws if any of the required environment variables are missing.
   */
  public static get instance() {
    if (!ShopifyApiClient.#instance) {
      if (!ACCESS_TOKEN) throw new Error("missing ACCESS_TOKEN env var. Please run `npm run token` first")
      if (!STORE_DOMAIN) throw new Error("missing STORE_DOMAIN env var. Refer to the README for more information")
      if (!API_VERSION) throw new Error("missing API_VERSION env var. Refer to the README for more information")
      ShopifyApiClient.#instance = createAdminApiClient({
        storeDomain: STORE_DOMAIN,
        accessToken: ACCESS_TOKEN,
        apiVersion: API_VERSION,
      })
    }
    return ShopifyApiClient.#instance
  }
}

/**
 * Executes a GraphQL query or mutation against the Shopify Admin API.
 * Throws a descriptive error if the request fails or returns GraphQL errors.
 *
 * @param document - The generated document node
 * @param variables - Optional variables to pass to the query/mutation
 * @returns The typed data from the response
 */
export async function shopifyRequest<T>(document: { loc?: { source: { body: string } } }, variables?: Record<string, unknown>) {
  const query = document.loc?.source.body
  if (!query) throw new Error("Invalid document: could not extract query string")

  let response
  try {
    response = await ShopifyApiClient.instance.request<T>(query, { variables })
  } catch (err) {
    throw new Error(`Shopify request failed: ${err instanceof Error ? err.message : JSON.stringify(err)}`, { cause: err })
  }

  const { data, errors } = response as GraphQLResponse<T>

  if (errors) throw new Error(`GraphQL errors: ${JSON.stringify(errors, null, 2)}`)
  if (!data) throw new Error("No data returned from Shopify API")

  return data
}

/**
 * Reads or creates the cache file and parses it as a Cache type object.
 * 
 * This is useful to avoid querying Shopify's API several times for the same IDs
 * as some are referenced by several resources.
 *
 * @function getCache
 * @param emptyCache - empty cache object to init the cache with in case it's empty
 * @param path - optional param for overriding the default cache file path
 * @returns Object with the cached data
 */
export function getCache<T>(emptyCache: T, path: string = CACHE_PATH) {
  if (!existsSync(path)) {
    writeFileSync(path, JSON.stringify(emptyCache))
  }
  try {
    return JSON.parse(readFileSync(path).toString()) as T
  } catch (error) {
    console.error("error parsing current cache file, make sure its format is up to date and is valid JSON")
    throw error
  }
}

/**
 * Overwrites the cache file with the given cache object.
 *
 * @function saveCache
 * @param data - The cache data to store
 * @param path - optional param for overriding the default cache file path
 */
export function saveCache<T>(data: T, path: string = CACHE_PATH) {
  const replacer = (_: string, value: unknown) => {
    if (value instanceof Set) return [...value]
    if (value instanceof Map) return Object.fromEntries(value)
    return value
  }
  writeFileSync(path, JSON.stringify(data, replacer, 2))
}

/**
 * Appends a message to the log file with a timestamp.
 *
 * @function log
 * @param message - The message to be logged
 * @param path - optional param for overriding the default log file path
 */
export function log(message: string, path: string = LOG_PATH) {
  if (!existsSync(path)) writeFileSync(path, "")
  const timestamp = (new Date()).toISOString()
  appendFileSync(path, `[${timestamp}] ${message}\n`)
}

/**
 * Clears the log file.
 *
 * @function resetLog
 * @param path - optional param for overriding the default log file path
 */
export function resetLog(path: string = LOG_PATH) {
  writeFileSync(path, "")
}