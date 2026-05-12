
import http from "http"
import { exec } from "child_process"
import crypto from "crypto"
import { appendFileSync } from "fs"

import { config } from "dotenv"

config({ quiet: true })

const { CLIENT_ID, CLIENT_SECRET, STORE_DOMAIN, SCOPES, REDIRECT_PATH, PORT } = process.env

if (!CLIENT_ID || !CLIENT_SECRET || !STORE_DOMAIN || !SCOPES || !REDIRECT_PATH || !PORT) throw new Error("Missing env vars. Refer to the README for more information.")

// Generate a random nonce to verify the callback is legitimate
const nonce = crypto.randomBytes(16).toString("hex")

const authUrl =
  `https://${STORE_DOMAIN}/admin/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&scope=${SCOPES}` +
  `&redirect_uri=${encodeURIComponent(`http://localhost:${PORT}/${REDIRECT_PATH}`)}` +
  `&state=${nonce}`

interface ShopifyTokenResponse { access_token: string, scope: string }

const server = http.createServer(async (request, response) => {
  if (!request.url?.startsWith(`/${REDIRECT_PATH}`)) return

  const params = new URL(request.url, `http://localhost:${PORT}`).searchParams

  // Validate state matches our nonce
  if (params.get("state") !== nonce) {
    response.end("State mismatch - possible CSRF attack")
    server.close()
    return
  }

  const code = params.get("code")

  // Exchange the code for an access token
  const tokenRes = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    }),
  })

  const { access_token } = (await tokenRes.json()) as ShopifyTokenResponse

  appendFileSync(".env", `\nACCESS_TOKEN="${access_token}"`)
  console.log("Access token saved at .env file as ACCESS_TOKEN")

  response.end("Done! You can close this tab.")
  server.close()
})

server.listen(PORT, () => {
  console.log(`Opening browser to authorize...`)
  // Open the auth URL in the browser
  const opener =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open"
  exec(`${opener} "${authUrl}"`)
})