import { useEffect, useState, useCallback, useRef } from 'react'
import { Layers, RefreshCw, BookOpen, Menu, X, Upload } from 'lucide-react'
import { UploadPanel } from '@/components/UploadPanel'
import { MessageList } from '@/components/MessageList'
import { ChatInput } from '@/components/ChatInput'
import { DocumentList } from '@/components/DocumentList'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { chat, listDocuments } from '@/lib/api'
import { cn } from '@/lib/utils'

let msgId = 0
const newId = () => ++msgId

export default function App() {
  const [documents, setDocuments] = useState([])
  const [activeDocId, setActiveDocId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('docs')
  const uploadPanelRef = useRef(null)

  // Load existing documents on mount
  const refreshDocs = useCallback(async () => {
    try {
      const { documents: docs } = await listDocuments()
      setDocuments(docs)
    } catch { }
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
    setSidebarOpen(false)
    setSidebarTab('docs')
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
        setMessages((m) => m.map((msg) => msg.id === aiId ? { ...msg, content: snapshot } : msg))
        await new Promise((r) => setTimeout(r, 18))
      }
      setMessages((m) => m.map((msg) => msg.id === aiId ? { ...msg, streaming: false } : msg))
    } catch (e) {
      setIsLoading(false)
      setMessages((m) => [...m, { id: aiId, role: 'assistant', content: e.message, error: true }])
    }
  }

  // Delete document
  const handleDeleted = (docId) => {
    setDocuments((prev) => prev.filter((d) => d !== docId))
    if (activeDocId === docId) { setActiveDocId(null); setMessages([]) }
  }

  const selectDoc = (id) => {
    setActiveDocId(id)
    setMessages([])
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg)]">

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        'flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] z-30 transition-transform duration-300 ease-in-out',
        // Desktop: always visible, fixed width
        'lg:relative lg:translate-x-0 lg:w-72 lg:shrink-0',
        // Mobile: drawer from left
        'fixed inset-y-0 left-0 w-[85vw] max-w-[320px]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>

        {/* Logo row */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--color-border)] shrink-0">
          <div className="rounded-lg bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 p-1.5">
            <Layers size={16} className="text-[var(--color-accent)]" />
          </div>
          <span className="font-bold tracking-tight text-gradient">DeepDive</span>
          <Badge variant="muted" className="text-[9px]">RAG</Badge>
          <button
            className="ml-auto lg:hidden text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex border-b border-[var(--color-border)] lg:hidden shrink-0">
          {[['docs', BookOpen, 'Documents'], ['upload', Upload, 'Upload']].map(([tab, Icon, label]) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                sidebarTab === tab
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Desktop: Upload always shown */}
        <div className="hidden lg:block p-3 border-b border-[var(--color-border)] shrink-0">
          <UploadPanel ref={uploadPanelRef} onDocumentReady={handleDocumentReady} />
        </div>

        {/* Mobile: Upload tab */}
        {sidebarTab === 'upload' && (
          <div className="lg:hidden p-3 overflow-y-auto flex-1">
            <UploadPanel onDocumentReady={handleDocumentReady} />
          </div>
        )}

        {/* Documents list — desktop always, mobile only on 'docs' tab */}
        <div className={cn(
          'flex-1 overflow-y-auto p-3',
          sidebarTab !== 'docs' && 'hidden lg:block'
        )}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest">
              Documents
            </span>
            <button
              onClick={refreshDocs}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors p-1"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <DocumentList
            documents={documents}
            activeId={activeDocId}
            onSelect={selectDoc}
            onDeleted={handleDeleted}
          />
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors p-1 shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <BookOpen size={15} className="text-[var(--color-accent)] shrink-0 hidden sm:block" />

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[var(--color-text)] truncate leading-tight">
              {activeDocId ?? 'No document selected'}
            </h1>
            <p className="text-[10px] text-[var(--color-muted)] hidden sm:block">
              {activeDocId
                ? `${messages.filter(m => m.role === 'user').length} question(s) asked`
                : 'Open the menu to upload or select a document'}
            </p>
          </div>

          {activeDocId && (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-xs shrink-0">
              Clear
            </Button>
          )}
        </header>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onOpenSidebar={() => {
            if (window.innerWidth >= 1024) {
              // Desktop: sidebar is always visible — open file picker directly
              uploadPanelRef.current?.triggerPicker()
            } else {
              // Mobile: slide in the drawer on the Upload tab
              setSidebarTab('upload')
              setSidebarOpen(true)
            }
          }}
        />

        {/* Input */}
        <ChatInput documentId={activeDocId} disabled={isLoading} onSend={handleSend} />
      </main>
    </div>
  )
}
