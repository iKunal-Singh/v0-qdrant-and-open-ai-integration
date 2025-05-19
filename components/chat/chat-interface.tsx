"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { SendIcon, LoaderIcon, FileTextIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { DocumentPreview } from "@/components/documents/document-preview"

interface ChatInterfaceProps {
  documentId?: string
  collectionId?: string
  initialMessages?: { role: string; content: string }[]
}

export function ChatInterface({ documentId, collectionId, initialMessages = [] }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSources, setShowSources] = useState<Record<string, boolean>>({})

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      documentId,
      collectionId,
    },
    initialMessages,
    onResponse: () => {
      setIsLoading(false)
    },
    onFinish: () => {
      setIsLoading(false)
    },
    onError: () => {
      setIsLoading(false)
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize with initial messages if provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages, setMessages])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    handleSubmit(e)
  }

  // Extract source references from message content
  const extractSourceReferences = (content: string) => {
    const sourceRegex = /\[source(\d+)\]/g
    const sources = new Set<string>()
    let match

    while ((match = sourceRegex.exec(content)) !== null) {
      sources.add(match[1])
    }

    return Array.from(sources)
  }

  // Toggle source visibility
  const toggleSource = (messageId: string) => {
    setShowSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] max-w-3xl mx-auto">
      <Card className="flex-1 overflow-y-auto p-6 mb-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-primary-light dark:bg-primary-dark">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileTextIcon className="mx-auto h-12 w-12 text-text-light/40 dark:text-text-dark/40 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-text-light dark:text-text-dark">Ask about your documents</h3>
              <p className="text-text-light/60 dark:text-text-dark/60">
                Start a conversation to query your {documentId ? "document" : collectionId ? "collection" : "documents"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              const isUser = message.role === "user"
              const messageId = `msg-${index}`
              const sourceRefs = isUser ? [] : extractSourceReferences(message.content)
              const hasSourceRefs = sourceRefs.length > 0

              return (
                <div key={messageId} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-4 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar
                      className={`h-10 w-10 ${isUser ? "bg-accent-light dark:bg-accent-dark" : "bg-secondary-light dark:bg-secondary-dark"}`}
                    >
                      {isUser ? "You" : "AI"}
                    </Avatar>

                    <div>
                      <div
                        className={`rounded-2xl px-5 py-3 ${
                          isUser
                            ? "bg-accent-light dark:bg-accent-dark text-white"
                            : "bg-secondary-light dark:bg-secondary-dark text-text-light dark:text-text-dark"
                        }`}
                      >
                        {message.content}

                        {hasSourceRefs && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs p-0 h-auto"
                              onClick={() => toggleSource(messageId)}
                            >
                              {showSources[messageId] ? "Hide sources" : "Show sources"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {hasSourceRefs && showSources[messageId] && (
                        <div className="mt-3 space-y-3">
                          {sourceRefs.map((sourceNum) => (
                            <DocumentPreview
                              key={`${messageId}-source-${sourceNum}`}
                              sourceId={Number.parseInt(sourceNum)}
                              documentId="mock-doc-1"
                              page={1}
                              text={`This is source ${sourceNum} content. In a real implementation, this would show the actual document content that was referenced.`}
                              file={`Source ${sourceNum}`}
                              title={`Reference ${sourceNum}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      <form onSubmit={onSubmit} className="flex gap-3">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder={`Ask a question about your ${documentId ? "document" : collectionId ? "collection" : "documents"}...`}
          className="flex-1 min-h-[60px] max-h-[120px] rounded-2xl border-gray-200 dark:border-gray-800 resize-none bg-primary-light dark:bg-primary-dark"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full h-12 w-12 p-0 flex items-center justify-center bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90"
        >
          {isLoading ? <LoaderIcon className="h-5 w-5 animate-spin" /> : <SendIcon className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  )
}
