# Qdrant & OpenAI Integration
## 🌐 Overview

This is a full-stack web application that combines Qdrant (vector database) with OpenAI's language models to offer document upload, embedding, search, and conversational capabilities. Users can register, upload documents, extract text, generate vector embeddings, and ask questions based on the uploaded content.

## ✨ Features

* User authentication (NextAuth)
* Document upload & management
* Text extraction from PDFs
* Embedding generation using OpenAI
* Vector storage using Qdrant
* Semantic search and chat interface
* Admin CMS for static pages
* Stripe-based pricing integration
* Dashboard for document and chat history

## 🛠 Tech Stack

* **Framework**: Next.js 14 (App Router)
* **UI**: Tailwind CSS, ShadCN UI
* **Auth**: NextAuth.js
* **Database**: Qdrant (Vector DB), Prisma + PostgreSQL (metadata)
* **AI Integration**: OpenAI API
* **Payments**: Stripe
* **Hosting**: Vercel

## 📁 Project Structure

```
app/
  ├── api/                  # API routes (REST endpoints)
  ├── auth/                 # Login/Register pages
  ├── chat/                 # Chat interface
  ├── dashboard/            # Dashboard layout & pages
  ├── admin/                # CMS admin pages
  ├── upload/               # Document upload page
  ├── layout.tsx           # Global layout
  ├── page.tsx             # Landing page

components/
  ├── chat/                # Chat UI
  ├── documents/           # Document-related components
  ├── collections/         # Collection forms
  ├── auth/                # Login/Register forms
  ├── payment/             # Stripe integration
  └── ui/                  # Reusable UI components (ShadCN)

lib/
  ├── embeddings.ts        # OpenAI embeddings helper
  ├── vector-db.ts         # Qdrant client setup
  ├── pdf-loader.ts        # PDF parsing logic
  ├── stripe.ts            # Stripe setup
  └── prisma.ts            # Prisma client
```

