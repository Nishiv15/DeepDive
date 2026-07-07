import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
})

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unknown error'
    return Promise.reject(new Error(detail))
  }
)

// Upload (with progress)
export async function uploadFile(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return data
}

// Chat
export async function chat({ documentId, query, topK = 5, includeCitations = true }) {
  const { data } = await api.post('/chat', {
    document_id: documentId,
    query,
    top_k: topK,
    include_citations: includeCitations,
  })
  return data
}

// Document management
export async function listDocuments() {
  const { data } = await api.get('/documents')
  return data
}

export async function deleteDocument(documentId) {
  const { data } = await api.delete(`/documents/${encodeURIComponent(documentId)}`)
  return data
}
