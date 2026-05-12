# Shopify GraphQL Starter

Node.js starter project for using [Shopify's GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql/latest).

## Shopify Store configuration

This starter works by authenticating through a custom Shopify app installed on the target store. To set up that app:

1. Go to [Shopify Dev Dashboard](https://dev.shopify.com/dashboard/) and create a new app.
2. Give it a name.
3. Add `http://localhost:3000/callback` as a redirect URL.
4. Uncheck "Embed app in Shopify admin".
5. Select the scopes you're going to need: [Shopify API access scopes](https://shopify.dev/docs/api/usage/access-scopes).
6. Create the app and its first release.
7. Install the app:
   1. Click on "Select distribution method" link in the app's dashboard.
   2. Select "Custom distribution".
   3. Enter the store's `[store-name].myshopify.com` domain and click on "Generate link".
   4. Copy the generated link and open it.
   5. Select the store you want and click on "Install".
   6. You'll see an error page, that's normal, continue with the steps in the "Installation" section.

## Installation

1. Install [Node.js](https://nodejs.org/)
2. Run `npm i` to install all of the project's dependencies.
3. Copy the file `.env.example` and rename the copy to `.env` updating the variable values as needed:
   - `CLIENT_ID`: The client ID of the app. You can get this from [Shopify Dev Dashboard](https://dev.shopify.com/dashboard/) selecting the app and then "Settings".
   - `CLIENT_SECRET`: The secret of the app. You can get this from [Shopify Dev Dashboard](https://dev.shopify.com/dashboard/) selecting the app and then "Settings".
   - `API_VERSION`: The API version to use. This needs to match the app's settings.
   - `STORE_DOMAIN`: The `[store-name].myshopify.com` domain where `[store-name]` is the name of the store.
   - `SCOPES`: The scopes you need access to. This needs to match the app's settings. [Shopify API access scopes](https://shopify.dev/docs/api/usage/access-scopes)
   - `REDIRECT_URI`: The redirect URL you want the "get-token.ts" script to listen on. This needs to match the one of the app's redirect URLs (generally "callback")
   - `PORT`: The port you want the "get-token.ts" script to run on. This needs to match the one of the app's redirect URLs (generally "3000")
4. Run `npm run token`. This will open a browser window where you can log in to the store and generate an access token.

**Note:** This project has a `.npmrc` that sets up some npm settings for security reasons:

- [min-release-age](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age)
- [allow-git](https://docs.npmjs.com/cli/v11/using-npm/config#allow-git)
- [ignore-scripts](https://docs.npmjs.com/cli/v11/using-npm/config#ignore-scripts)

If you need to modify or remove any of these, please make sure to understand the risks involved in doing so.

## Development

The entry point for this project is `src/index.ts`, which includes a working example covering the core patterns of this starter and Shopify's GraphQL API: authentication, querying the API, pagination, caching, and logging.

Write your script code here, replacing or building on top of the example.

## Run

1. `npm run codegen` to generate the GraphQL types and document objects.
2. `npm run dev` to run the script located at `src/index.ts`

You can also run `npm run codegen:watch` to keep listening for changes in your .graphql files.

## Writing GraphQL Queries & Mutations

Write your queries and mutations in `.graphql` files inside `src/queries/`. You can keep them all in one file or split them across multiple files, whichever you prefer.

Run `npm run codegen` after any changes to your `.graphql` files to regenerate the types and document objects used to make API requests, or keep `npm run codegen:watch` running in a separate terminal to do it automatically on save.

## Output

If you need to output any files you can do so inside the `output/` folder.
Its contents are git-ignored so nothing in it will be committed to the repo.

## Cache

The helper functions at `src/helpers.ts` include a simple file-based cache (git-ignored).
It only caches what you explicitly save to it. Use it to avoid re-fetching data across repeated runs, which is particularly useful when working with large datasets or when a script gets interrupted mid-run.
The helper exposes 2 functions for managing caching `getCache` and `saveCache`. Check their signature for more details on how to use them.
The cached data will be stored in `cache/cache.json` by default but you can define other paths by using the cache functions' second optional parameter.

**Gotcha:** If you store Maps or Sets in the cache, they’ll be restored as plain objects and arrays respectively. To restore them properly you can do this:

```typescript
type Cache = { set: Set<string>; map: Map<string, string> };
let { set, map } = getCache<Cache>({ set: new Set(), map: new Map() });
set = new Set(set);
map = new Map(Object.entries(map));
```

## Logging

The helper functions at `src/helpers.ts` include a simple file-based logger (git-ignored).
The helper exposes 2 functions for managing logging `log` and `resetLog`. Check their signature for more details on how to use them.
The logs will be stored in `logs/messages.log` by default but you can define other paths by using the log functions' second optional parameter.

## Data

If you need to work with any input data files (CSVs, JSONs, etc.) you can drop them into the `data/` folder.
Its contents are git-ignored so nothing in it will be committed to the repo.
