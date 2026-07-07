const BASE = '/api/v1'

// Safe JSON parse helper
function safeParseJson(text) {
  try { return JSON.parse(text) } catch { return null }
}

function extractDetail(body, fallback) {
  const parsed = safeParseJson(body)
  return parsed?.detail || parsed?.message || fallback
}

// Upload
export async function uploadFile(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(safeParseJson(xhr.responseText))
      } else {
        reject(new Error(extractDetail(xhr.responseText, `Upload failed (HTTP ${xhr.status})`)))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}

// Chat
export async function chat({ documentId, query, topK = 5, includeCitations = true }) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      query,
      top_k: topK,
      include_citations: includeCitations,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractDetail(text, `Chat failed (HTTP ${res.status})`))
  }

  return res.json()
}

// Document management
export async function listDocuments() {
  const res = await fetch(`${BASE}/documents`)
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

export async function deleteDocument(documentId) {
  const res = await fetch(`${BASE}/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete document')
  return res.json()
}
