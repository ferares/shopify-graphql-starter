import type { IGraphQLConfig } from "graphql-config"
import { config } from "dotenv"

config({ quiet: true })

const { API_VERSION } = process.env

if (!API_VERSION) throw new Error("Missing API_VERSION env var. Refer to the README for more information")

const schema = `https://shopify.dev/admin-graphql-direct-proxy/${API_VERSION}`

const graphQLConfig: IGraphQLConfig = {
  schema,
  documents: "src/**/*.graphql",
  extensions: {
    languageService: {
      useSchemaFileDefinitions: true,
    },
    codegen: {
      overwrite: true,
      generates: {
        "src/generated/graphql.ts": {
          plugins: [
            "typescript",
            "typescript-operations",
            "typescript-graphql-request",
          ],
          config: {
            scalars: {
              DateTime: "string",
              Decimal: "string",
              HTML: "string",
              JSON: "string",
              Money: "string",
              URL: "string",
              UnsignedInt64: "string",
            },
          },
        },
      },
    },
  },
}

export default graphQLConfig