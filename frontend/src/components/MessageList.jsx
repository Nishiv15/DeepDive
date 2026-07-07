import { useEffect, useRef } from 'react'
import { Bot, User, AlertCircle } from 'lucide-react'
import { SourcesDrawer } from '@/components/SourcesDrawer'
import { cn } from '@/lib/utils'

// Typing animation for AI responses
function TypingText({ text }) {
  return (
    <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap break-words">
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
    <div className={cn('flex gap-2 sm:gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar — hidden on very small screens */}
      <div className={cn(
        'hidden xs:flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border',
        isUser
          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent-2)]'
          : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)]'
      )}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[90%] sm:max-w-[80%] space-y-1',
        isUser && 'items-end'
      )}>
        <div className={cn(
          'rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3',
          isUser
            ? 'bg-[var(--color-accent)] text-white rounded-tr-sm'
            : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-tl-sm'
        )}>
          {message.error ? (
            <div className="flex items-start gap-2 text-sm text-[var(--color-error)]">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span className="break-words">{message.content}</span>
            </div>
          ) : isStreaming ? (
            <TypingText text={message.content} />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
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

// Thinking dots
function ThinkingBubble() {
  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="hidden xs:flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--color-surface-2)] border-[var(--color-border)]">
        <Bot size={13} className="text-[var(--color-muted)]" />
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6 sm:p-8 overflow-y-auto">
        <div className="rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] p-4 sm:p-5">
          <Bot size={28} className="text-[var(--color-accent)] sm:w-8 sm:h-8" />
        </div>
        <h3 className="font-semibold text-[var(--color-text)] text-sm sm:text-base">Ready to answer</h3>
        <p className="text-xs sm:text-sm text-[var(--color-muted)] max-w-[260px] sm:max-w-xs">
          Upload a document and ask anything about it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <ThinkingBubble />}
      <div ref={bottomRef} />
    </div>
  )
}
