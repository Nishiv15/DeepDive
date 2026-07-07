import { useState } from 'react'
import { Trash2, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteDocument } from '@/lib/api'
import { cn } from '@/lib/utils'

export function DocumentList({ documents, activeId, onSelect, onDeleted }) {
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    setDeleting(docId)
    try {
      await deleteDocument(docId)
      onDeleted(docId)
    } catch {
      // silent fail
    } finally {
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-xs text-[var(--color-muted)] text-center py-4">
        No documents indexed yet.
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {documents.map((doc) => (
        <li key={doc}>
          <button
            onClick={() => onSelect(doc)}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all group',
              activeId === doc
                ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent-2)]'
                : 'hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)] border border-transparent'
            )}
          >
            <FileText size={13} className="shrink-0" />
            <span className="flex-1 truncate font-medium">{doc}</span>
            {activeId === doc && <ChevronRight size={12} />}
            <button
              onClick={(e) => handleDelete(e, doc)}
              disabled={deleting === doc}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-muted)] hover:text-[var(--color-error)] p-0.5 rounded',
                activeId === doc && 'opacity-100'
              )}
            >
              <Trash2 size={12} />
            </button>
          </button>
        </li>
      ))}
    </ul>
  )
}
