import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, FileText, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function SourcesDrawer({ citations }) {
  const [open, setOpen] = useState(false)

  if (!citations || citations.length === 0) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent-2)] transition-colors group"
      >
        <BookOpen size={13} className="group-hover:text-[var(--color-accent)]" />
        <span className="font-medium">{citations.length} source{citations.length > 1 ? 's' : ''} used</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {citations.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default">
                  <Hash size={10} className="mr-0.5" />
                  Chunk {c.chunk_index + 1}
                </Badge>
                {c.page && (
                  <Badge variant="muted">
                    <FileText size={10} className="mr-0.5" />
                    Page {c.page}
                  </Badge>
                )}
                <Badge
                  variant={c.score > 0.75 ? 'success' : 'muted'}
                  className="ml-auto"
                >
                  {(c.score * 100).toFixed(0)}% match
                </Badge>
              </div>

              {/* Highlighted snippet */}
              <p className="text-xs text-[var(--color-muted)] leading-relaxed font-mono bg-[var(--color-bg)] rounded p-2 border border-[var(--color-border)] line-clamp-4">
                {c.snippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
