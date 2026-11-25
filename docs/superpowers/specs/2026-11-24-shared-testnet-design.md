# Shared testnet deployment

The user selected a public testnet for the group, with Vercel and cloud PostgreSQL. Use Ethereum Sepolia (11155111), Vercel Next.js hosting, and a separate PostgreSQL database with TLS. Hardhat remains the default local development configuration until testnet credentials and deployment coordinates are configured.

One public network setting must drive the wallet, contract hooks, license documents, API verification and SIWE chain ID. Never select a network from an untrusted request or silently fall back to local when Sepolia configuration is missing. Sepolia requires a deployed WorkRegistry address and its deployment block, using the existing generated ABI without editing that generated file manually.

Bound event queries to the deployment block and bounded block ranges. Preserve the exact transaction, grant block and contract identity in shared links. Local explorer pages redirect to the public explorer in testnet mode; do not open localhost RPC from those pages.

Use a fresh deployer encrypted by the existing account-generation CLI. Do not store private keys in frontend or cloud frontend configuration. Public deployment coordinates can be copied from a confirmed deployment receipt. A read-only preflight checks RPC chain, contract code, receipt/address/block, HTTPS origin and database connectivity/schema before handing over the deployment.

Vercel needs cloud DATABASE_URL, a private session secret, canonical HTTPS SIWE_ORIGIN, the server RPC URL and matching public chain/deployment coordinates. Do not reuse local/test databases or auto-seed/reset on application startup. Integration tests remain localhost-only and must reject a configured testnet target.

Alternatives: persistent local node does not meet the group's Internet sharing choice. Hosting frontend alone leaves both local blockchain and local PostgreSQL unavailable to teammates. Sepolia + hosted backend/database meets the selected use case without changing WorkRegistry V1.

External dependencies remain user-owned: Vercel and database accounts, RPC credentials if needed, and a funded Sepolia deployer. Prepare and verify the code without inventing those credentials or claiming a live deployment before it exists. The old lost local registration must be submitted again on Sepolia.
