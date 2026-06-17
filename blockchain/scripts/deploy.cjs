const { ethers } = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Desplegando con cuenta:", deployer.address)
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CELO")

  const platformWallet = process.env.CELO_PLATFORM_WALLET || deployer.address
  const authorizedBackend = process.env.CELO_BACKEND_WALLET || deployer.address

  console.log("Platform wallet:", platformWallet)
  console.log("Authorized backend:", authorizedBackend)

  const OrientaProfPayments = await ethers.getContractFactory("OrientaProfPayments")
  const contract = await OrientaProfPayments.deploy(platformWallet, authorizedBackend)

  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log("Contract deployed to:", address)
  console.log("Transaction counter:", (await contract.transactionCounter()).toString())
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
