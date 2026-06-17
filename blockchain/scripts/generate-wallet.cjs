const { ethers } = require("hardhat")

async function main() {
  const wallet = ethers.Wallet.createRandom()
  console.log("Address:", wallet.address)
  console.log("Private Key:", wallet.privateKey)
  console.log("")
  console.log("Add this to your .env:")
  console.log(`CELO_PRIVATE_KEY="${wallet.privateKey}"`)
  console.log("")
  console.log("Fund this wallet from the Alfajores faucet:")
  console.log("https://faucet.celo.org/alfajores")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
