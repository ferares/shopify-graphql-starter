import { ProductCollectionsDocument, ProductCollectionsQuery, VariantsProductIdDocument, VariantsProductIdQuery } from './generated/graphql'

import { getCache, log, resetLog, saveCache, shopifyRequest } from "./helpers"

// What follows is a usage example for Shopify's GraphQL API. Replace it with your own logic.

type Cache = {
  // We store pageInfo for the variants in the cache to keep track of where we were in case the script gets interrupted
  variants: { record: Record<string, { productId: string }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } }
  products: Record<string, { collections: { id: string, title: string }[] }>
}

/**
 * Get all the variants in the store and for each one get all the collections they're in
 */
async function main() {
  // Clear the logs
  resetLog()
  // Get the cached results so far
  let { variants, products } = getCache<Cache>({ products: {}, variants: { record: {}, pageInfo: { endCursor: null, hasNextPage: true } } })
  // While there are more pages...
  while (variants.pageInfo.hasNextPage) {
    // Get the variant ID and its parent product's ID
    const data = await shopifyRequest<VariantsProductIdQuery>(VariantsProductIdDocument, { cursor: variants.pageInfo.endCursor })
    // Update the pagination data for the next iteration
    variants.pageInfo = data.productVariants.pageInfo
    // For each queried variant...
    for (const edge of data.productVariants.edges) {
      // Log our progress
      log(`Processing variant ${edge.node.id}`)
      const variantId = edge.node.id
      // Check if its data is already cached and skip it if so
      if (variants.record[variantId]) continue
      const productId = edge.node.product.id
      variants.record[variantId] = { productId }
      // Check if its parent product has already been cached and skip it if so
      if (products[productId]) continue
      // Query the variant's parent product to get its collections
      const productData = await shopifyRequest<ProductCollectionsQuery>(ProductCollectionsDocument, { id: productId })
      // Store the product's data
      products[productId] = { collections: productData.product?.collections.edges.map(edge => ({ id: edge.node.id, title: edge.node.title })) ?? [] }
      // Update the cache so we don't loose our progress if the script gets interrupted
      saveCache<Cache>({ variants, products })
    }
  }
  // Process the queried data here....
}

main()