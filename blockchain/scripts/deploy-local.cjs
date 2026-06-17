const { ethers } = require("hardhat")

async function main() {
  const [deployer, client, professional] = await ethers.getSigners()

  console.log("=== Deploying to local Hardhat node ===")
  console.log("Deployer:", deployer.address)
  console.log("Client:", client.address)
  console.log("Professional:", professional.address)

  const OrientaProfPayments = await ethers.getContractFactory("OrientaProfPayments")
  const contract = await OrientaProfPayments.deploy(deployer.address, deployer.address)
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log("\nContract deployed to:", address)
  console.log("Transaction counter:", (await contract.transactionCounter()).toString())

  console.log("\n=== Testing deposit ===")
  const tx1 = await contract.connect(client).deposit("test-consultation-1", professional.address, {
    value: ethers.parseEther("0.1"),
  })
  await tx1.wait()
  console.log("Deposit tx:", tx1.hash)
  console.log("Counter after deposit:", (await contract.transactionCounter()).toString())

  const txn = await contract.getTransaction(0)
  console.log("\nTransaction 0:", {
    consultationId: txn.consultationId,
    clientWallet: txn.clientWallet,
    professionalWallet: txn.professionalWallet,
    amount: ethers.formatEther(txn.amount),
    status: Number(txn.status),
  })

  console.log("\n=== Testing release ===")
  const tx2 = await contract.release(0)
  await tx2.wait()
  console.log("Release tx:", tx2.hash)
  console.log("Status after release:", Number((await contract.getTransaction(0)).status))

  console.log("\n=== All contract tests passed! ===")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
