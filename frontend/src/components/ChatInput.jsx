import { useRef, useState } from 'react'
import { Send, Loader2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ChatInput({ onSend, disabled, documentId }) {
  const [query, setQuery] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [topK, setTopK] = useState(5)
  const [includeCitations, setIncludeCitations] = useState(true)
  const textareaRef = useRef(null)

  const canSend = query.trim().length > 0 && !disabled && !!documentId

  const submit = () => {
    if (!canSend) return
    onSend({ query: query.trim(), topK, includeCitations })
    setQuery('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const onKeyDown = (e) => {
    // On mobile (touch) don't submit on Enter — let them use the button
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
      e.preventDefault()
      submit()
    }
  }

  const onInput = (e) => {
    setQuery(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 space-y-2 sm:space-y-3 shrink-0">

      {/* Options panel */}
      {showOptions && (
        <div className="glass rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-text)]">Chunks (top-K)</label>
            <span className="text-xs font-bold text-[var(--color-accent-2)]">{topK}</span>
          </div>
          <input
            type="range" min={1} max={20} value={topK}
            onChange={(e) => setTopK(+e.target.value)}
            className="w-full accent-[var(--color-accent)] cursor-pointer"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={includeCitations}
              onChange={(e) => setIncludeCitations(e.target.checked)}
              className="accent-[var(--color-accent)] w-4 h-4"
            />
            <span className="text-xs text-[var(--color-text)]">Include citations</span>
          </label>
        </div>
      )}

      {/* Input row */}
      <div className={cn(
        'flex items-end gap-2 rounded-xl border p-2 transition-colors',
        !documentId
          ? 'border-[var(--color-border)] opacity-60'
          : 'border-[var(--color-border-bright)] focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_var(--color-accent-glow)]'
      )}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          onInput={onInput}
          onKeyDown={onKeyDown}
          disabled={!documentId || disabled}
          placeholder={documentId ? 'Ask anything…' : 'Select a document first'}
          className="flex-1 resize-none bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none leading-relaxed py-1 px-2 max-h-[120px] overflow-y-auto"
        />
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon"
            onClick={() => setShowOptions((o) => !o)}
            className={cn('h-8 w-8', showOptions && 'text-[var(--color-accent)]')}
            title="Options"
          >
            <SlidersHorizontal size={14} />
          </Button>
          <Button size="icon" onClick={submit} disabled={!canSend} className="h-8 w-8">
            {disabled ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--color-muted)] hidden sm:block">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
