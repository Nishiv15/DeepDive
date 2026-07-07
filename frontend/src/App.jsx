import { useEffect, useState, useCallback } from 'react'
import { Layers, RefreshCw, BookOpen } from 'lucide-react'
import { UploadPanel } from '@/components/UploadPanel'
import { MessageList } from '@/components/MessageList'
import { ChatInput } from '@/components/ChatInput'
import { DocumentList } from '@/components/DocumentList'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { chat, listDocuments } from '@/lib/api'

let msgId = 0
const newId = () => ++msgId

export default function App() {
  const [documents, setDocuments] = useState([])
  const [activeDocId, setActiveDocId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load existing documents on mount
  const refreshDocs = useCallback(async () => {
    try {
      const { documents: docs } = await listDocuments()
      setDocuments(docs)
    } catch {
    }
  }, [])

  useEffect(() => { refreshDocs() }, [refreshDocs])

  // After successful upload
  const handleDocumentReady = (data) => {
    setDocuments((prev) => {
      if (prev.includes(data.document_id)) return prev
      return [data.document_id, ...prev]
    })
    setActiveDocId(data.document_id)
    setMessages([])
  }

  // Chat send
  const handleSend = async ({ query, topK, includeCitations }) => {
    if (!activeDocId) return

    const userMsg = { id: newId(), role: 'user', content: query }
    setMessages((m) => [...m, userMsg])
    setIsLoading(true)

    const aiId = newId()
    try {
      const data = await chat({ documentId: activeDocId, query, topK, includeCitations })

      const words = data.answer.split(' ')
      setMessages((m) => [...m, { id: aiId, role: 'assistant', content: '', streaming: true, citations: data.citations }])
      setIsLoading(false)

      let current = ''
      for (let i = 0; i < words.length; i++) {
        current += (i === 0 ? '' : ' ') + words[i]
        const snapshot = current
        setMessages((m) =>
          m.map((msg) => msg.id === aiId ? { ...msg, content: snapshot } : msg)
        )
        await new Promise((r) => setTimeout(r, 18))
      }

      // Mark streaming done
      setMessages((m) =>
        m.map((msg) => msg.id === aiId ? { ...msg, streaming: false } : msg)
      )
    } catch (e) {
      setIsLoading(false)
      setMessages((m) => [
        ...m,
        { id: aiId, role: 'assistant', content: e.message, error: true },
      ])
    }
  }

  // Delete document
  const handleDeleted = (docId) => {
    setDocuments((prev) => prev.filter((d) => d !== docId))
    if (activeDocId === docId) {
      setActiveDocId(null)
      setMessages([])
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">

      {/*Sidebar*/}
      <aside className="w-72 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
          <div className="rounded-lg bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 p-1.5">
            <Layers size={18} className="text-[var(--color-accent)]" />
          </div>
          <span className="font-bold text-[var(--color-text)] tracking-tight text-gradient">DeepDive</span>
          <Badge variant="muted" className="ml-auto text-[9px]">RAG</Badge>
        </div>

        {/* Upload */}
        <div className="p-3 border-b border-[var(--color-border)]">
          <UploadPanel onDocumentReady={handleDocumentReady} />
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest">
              Documents
            </span>
            <button
              onClick={refreshDocs}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <DocumentList
            documents={documents}
            activeId={activeDocId}
            onSelect={(id) => { setActiveDocId(id); setMessages([]) }}
            onDeleted={handleDeleted}
          />
        </div>
      </aside>

      {/*Chat area*/}
      <main className="flex flex-1 flex-col min-w-0">

        {/* Chat header */}
        <header className="flex items-center gap-3 px-6 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <BookOpen size={16} className="text-[var(--color-accent)]" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[var(--color-text)] truncate">
              {activeDocId ?? 'No document selected'}
            </h1>
            <p className="text-[10px] text-[var(--color-muted)]">
              {activeDocId ? `${messages.filter(m => m.role === 'user').length} question(s) asked` : 'Select or upload a document to start chatting'}
            </p>
          </div>
          {activeDocId && (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-xs">
              Clear chat
            </Button>
          )}
        </header>

        {/* Messages */}
        <MessageList messages={messages} isLoading={isLoading} />

        {/* Input */}
        <ChatInput
          documentId={activeDocId}
          disabled={isLoading}
          onSend={handleSend}
        />
      </main>
    </div>
  )
}
