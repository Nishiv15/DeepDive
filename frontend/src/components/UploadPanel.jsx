import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadFile } from '@/lib/api'
import { cn } from '@/lib/utils'

const ACCEPT = '.pdf,.docx,.txt,.xlsx'
const MIME_LABELS = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
}

export function UploadPanel({ onDocumentReady }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle | uploading | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFile = (f) => {
    setFile(f)
    setStatus('idle')
    setError('')
    setResult(null)
    setProgress(0)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const doUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setError('')
    setProgress(0)
    try {
      const data = await uploadFile(file, setProgress)
      setResult(data)
      setStatus('done')
      onDocumentReady(data)
    } catch (e) {
      setStatus('error')
      setError(e.message)
    }
  }

  const reset = () => {
    setFile(null)
    setStatus('idle')
    setError('')
    setResult(null)
    setProgress(0)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload size={16} className="text-[var(--color-accent)]" />
          Upload Document
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">
        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all duration-200',
            dragging
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] scale-[1.01]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-bright)] hover:bg-[var(--color-surface-2)]'
          )}
        >
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          <div className="rounded-full bg-[var(--color-surface-2)] p-3 border border-[var(--color-border)]">
            <Upload size={22} className="text-[var(--color-accent)]" />
          </div>
          <div className="text-center">
            <p className="text-sm text-[var(--color-text)] font-medium">Drop file or click to browse</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">PDF, DOCX, TXT, XLSX supported</p>
          </div>
        </div>

        {/* Selected file */}
        {file && status !== 'done' && (
          <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3">
            <FileText size={18} className="text-[var(--color-accent)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--color-text)]">{file.name}</p>
              <p className="text-xs text-[var(--color-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Badge variant="muted">{MIME_LABELS[file.type] ?? 'FILE'}</Badge>
            <button onClick={reset} className="text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Progress bar */}
        {status === 'uploading' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--color-muted)]">
              <span>Uploading & indexing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success state */}
        {status === 'done' && result && (
          <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[var(--color-success)]" />
              <span className="text-sm font-medium text-[var(--color-success)]">Indexed successfully</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
              <div className="rounded-md bg-[var(--color-surface-2)] p-2">
                <div className="text-[var(--color-text)] font-semibold text-lg">{result.chunks_stored}</div>
                <div>Chunks stored</div>
              </div>
              <div className="rounded-md bg-[var(--color-surface-2)] p-2">
                <div className="text-[var(--color-text)] font-semibold text-lg">{result.pages_detected}</div>
                <div>Pages detected</div>
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)] truncate">ID: {result.document_id}</p>
            <Button variant="ghost" size="sm" onClick={reset} className="w-full">
              Upload another
            </Button>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex items-start gap-2 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-3">
            <AlertCircle size={15} className="text-[var(--color-error)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--color-error)]">{error}</p>
          </div>
        )}

        {/* Upload button */}
        {file && status === 'idle' && (
          <Button onClick={doUpload} className="w-full">
            <Upload size={15} />
            Index Document
          </Button>
        )}

        {status === 'uploading' && (
          <Button disabled className="w-full">
            <Loader2 size={15} className="animate-spin" />
            Processing…
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
