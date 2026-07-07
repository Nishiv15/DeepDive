import { useEffect, useRef } from 'react'
import { Bot, User, Loader2, AlertCircle } from 'lucide-react'
import { SourcesDrawer } from '@/components/SourcesDrawer'
import { cn } from '@/lib/utils'

// Typing animation for AI responses
function TypingText({ text }) {
  return (
    <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
      {text}
      <span className="inline-block w-1 h-4 bg-[var(--color-accent)] ml-0.5 animate-pulse rounded-sm" />
    </p>
  )
}

// Single message bubble
function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isStreaming = message.streaming

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
        isUser
          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent-2)]'
          : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)]'
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[80%] space-y-1', isUser && 'items-end')}>
        <div className={cn(
          'rounded-2xl px-4 py-3',
          isUser
            ? 'bg-[var(--color-accent)] text-white rounded-tr-sm'
            : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-tl-sm'
        )}>
          {message.error ? (
            <div className="flex items-start gap-2 text-sm text-[var(--color-error)]">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {message.content}
            </div>
          ) : isStreaming ? (
            <TypingText text={message.content} />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Sources */}
        {!isUser && !isStreaming && message.citations?.length > 0 && (
          <div className="px-1">
            <SourcesDrawer citations={message.citations} />
          </div>
        )}
      </div>
    </div>
  )
}

// Skeleton loader while waiting
function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--color-surface-2)] border-[var(--color-border)]">
        <Bot size={14} className="text-[var(--color-muted)]" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// Message list
export function MessageList({ messages, isLoading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
        <div className="rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] p-5">
          <Bot size={32} className="text-[var(--color-accent)]" />
        </div>
        <h3 className="font-semibold text-[var(--color-text)]">Ready to answer</h3>
        <p className="text-sm text-[var(--color-muted)] max-w-xs">
          Upload a document on the left, then ask anything about it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <ThinkingBubble />}
      <div ref={bottomRef} />
    </div>
  )
}
