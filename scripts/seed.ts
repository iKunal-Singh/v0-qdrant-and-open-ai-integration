import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting database seeding...")

  // Create users
  console.log("Creating users...")

  // Admin user
  const adminPassword = await hash("Admin123!", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@agentdoc.com" },
    update: {},
    create: {
      id: `user_${uuidv4()}`,
      name: "Admin User",
      email: "admin@agentdoc.com",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // Regular user
  const userPassword = await hash("User123!", 10)
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      id: `user_${uuidv4()}`,
      name: "Test User",
      email: "user@example.com",
      password: userPassword,
      role: "USER",
    },
  })
  console.log(`Created regular user: ${user.email}`)

  // Create collections for the user
  console.log("Creating collections...")
  const workCollection = await prisma.collection.create({
    data: {
      id: `col_${uuidv4()}`,
      name: "Work Documents",
      description: "Important work-related documents",
      isPublic: false,
      userId: user.id,
    },
  })

  const personalCollection = await prisma.collection.create({
    data: {
      id: `col_${uuidv4()}`,
      name: "Personal Documents",
      description: "Personal documents and notes",
      isPublic: false,
      userId: user.id,
    },
  })
  console.log(`Created collections: ${workCollection.name}, ${personalCollection.name}`)

  // Create sample documents
  console.log("Creating sample documents...")
  const sampleDoc1 = await prisma.document.create({
    data: {
      id: `doc_${uuidv4()}`,
      title: "Sample Report",
      fileName: "sample_report.pdf",
      fileSize: 1024 * 1024, // 1MB
      fileType: "application/pdf",
      status: "COMPLETED",
      pageCount: 5,
      userId: user.id,
    },
  })

  const sampleDoc2 = await prisma.document.create({
    data: {
      id: `doc_${uuidv4()}`,
      title: "Meeting Notes",
      fileName: "meeting_notes.pdf",
      fileSize: 512 * 1024, // 512KB
      fileType: "application/pdf",
      status: "COMPLETED",
      pageCount: 2,
      userId: user.id,
    },
  })
  console.log(`Created documents: ${sampleDoc1.title}, ${sampleDoc2.title}`)

  // Add documents to collections
  await prisma.documentCollection.create({
    data: {
      documentId: sampleDoc1.id,
      collectionId: workCollection.id,
    },
  })

  await prisma.documentCollection.create({
    data: {
      documentId: sampleDoc2.id,
      collectionId: workCollection.id,
    },
  })
  console.log("Added documents to collections")

  // Create document chunks
  console.log("Creating document chunks...")
  await prisma.documentChunk.createMany({
    data: [
      {
        id: `chunk_${uuidv4()}`,
        documentId: sampleDoc1.id,
        text: "This is the first page of the sample report. It contains an executive summary of the project.",
        page: 1,
        section: "Executive Summary",
        keywords: ["executive", "summary", "project", "report"],
        vectorId: `${sampleDoc1.id}-1`,
      },
      {
        id: `chunk_${uuidv4()}`,
        documentId: sampleDoc1.id,
        text: "The second page details the project scope and objectives. Key milestones are outlined.",
        page: 2,
        section: "Project Scope",
        keywords: ["scope", "objectives", "milestones", "project"],
        vectorId: `${sampleDoc1.id}-2`,
      },
      {
        id: `chunk_${uuidv4()}`,
        documentId: sampleDoc2.id,
        text: "Meeting notes from the quarterly review. Attendees: John, Sarah, Mike, and Lisa.",
        page: 1,
        section: "Attendees",
        keywords: ["meeting", "notes", "quarterly", "review", "attendees"],
        vectorId: `${sampleDoc2.id}-1`,
      },
    ],
  })
  console.log("Created document chunks")

  // Create CMS pages
  console.log("Creating CMS pages...")
  await prisma.page.createMany({
    data: [
      {
        id: `page_${uuidv4()}`,
        title: "About Us",
        slug: "about-us",
        content: `
# About Agent DOC

Agent DOC is an intelligent document search and retrieval system powered by AI. 

## Our Mission

Our mission is to make document search and retrieval as simple and efficient as possible. With Agent DOC, you can:

- Upload and process PDF documents
- Chat with your documents using AI
- Organize documents into collections
- Search across your document library

## Technology

Agent DOC uses cutting-edge AI technology to understand your documents and provide accurate answers to your questions.
        `,
        isPublished: true,
      },
      {
        id: `page_${uuidv4()}`,
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: `
# Privacy Policy

This is a sample privacy policy for Agent DOC.

## Data Collection

We collect the following information:
- User account information
- Uploaded documents
- Chat history

## Data Usage

Your data is used to:
- Provide the document search and retrieval service
- Improve our AI models
- Enhance user experience

## Data Protection

We take data protection seriously and implement industry-standard security measures.
        `,
        isPublished: true,
      },
    ],
  })
  console.log("Created CMS pages")

  console.log("Database seeding completed!")
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
