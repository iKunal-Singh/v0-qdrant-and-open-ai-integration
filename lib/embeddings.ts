import { OpenAIEmbeddings } from "@langchain/openai"

// Initialize the embeddings model
const embeddingsModel = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-ada-002",
})

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    // Generate embedding
    const embedding = await embeddingsModel.embedQuery(text)
    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    // Return a random embedding as fallback (not for production use)
    return Array(1536)
      .fill(0)
      .map(() => Math.random() * 2 - 1)
  }
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Generate embeddings for multiple texts
    const embeddings = await embeddingsModel.embedDocuments(texts)
    return embeddings
  } catch (error) {
    console.error("Error generating embeddings:", error)
    // Return random embeddings as fallback (not for production use)
    return texts.map(() =>
      Array(1536)
        .fill(0)
        .map(() => Math.random() * 2 - 1),
    )
  }
}
