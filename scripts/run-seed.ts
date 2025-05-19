import { PrismaClient } from "@prisma/client"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Checking database connection...")
    await prisma.$connect()
    console.log("Database connection successful!")

    console.log("Running database seed...")
    const { stdout, stderr } = await execAsync("npm run seed")

    if (stderr) {
      console.error("Error during seed execution:", stderr)
    }

    console.log(stdout)
    console.log("Database seed completed successfully!")
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
