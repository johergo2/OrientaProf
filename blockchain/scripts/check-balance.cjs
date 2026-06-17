const { ethers } = require("hardhat")

async function main() {
  const address = process.argv[2] || (await ethers.getSigners())[0].address
  const balance = await ethers.provider.getBalance(address)
  console.log("Address:", address)
  console.log("Balance:", ethers.formatEther(balance), "CELO")
}

main().catch(console.error)
