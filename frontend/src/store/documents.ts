import { create } from 'zustand'
import type { Document, IngestionStatus } from '@/types/api'
import { documentsApi } from '@/lib/rag-api'

interface DocumentState {
  documents: Document[]
  loading: boolean
  error: string | null
  selectedDocumentId: string | null
  ingestionStatuses: Record<string, { status: IngestionStatus; progress: number }>
  documentsPollingInterval: NodeJS.Timeout | null

  // Actions
  fetchDocuments: () => Promise<void>
  uploadDocument: (file: File) => Promise<Document>
  deleteDocument: (id: string) => Promise<void>
  selectDocument: (id: string | null) => void
  updateIngestionStatus: (documentId: string, status: IngestionStatus, progress: number) => void
  clearError: () => void
  startPolling: () => void
  stopPolling: () => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  selectedDocumentId: null,
  ingestionStatuses: {},
  documentsPollingInterval: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null })
    try {
      const documents = await documentsApi.getAll()
      set({ documents, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents'
      set({ error: errorMessage, loading: false })
    }
  },

  uploadDocument: async (file: File) => {
    set({ loading: true, error: null })
    try {
      const document = await documentsApi.upload(file)
      set((state) => ({
        documents: [document, ...state.documents],
        loading: false,
        ingestionStatuses: {
          ...state.ingestionStatuses,
          [document.id]: { status: document.status, progress: 0 },
        },
      }))
      return document
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  deleteDocument: async (id: string) => {
    try {
      await documentsApi.delete(id)
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
        ingestionStatuses: Object.fromEntries(
          Object.entries(state.ingestionStatuses).filter(([docId]) => docId !== id)
        ),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document'
      set({ error: errorMessage })
      throw error
    }
  },

  selectDocument: (id: string | null) => {
    set({ selectedDocumentId: id })
  },

  updateIngestionStatus: (documentId: string, status: IngestionStatus, progress: number) => {
    set((state) => ({
      ingestionStatuses: {
        ...state.ingestionStatuses,
        [documentId]: { status, progress },
      },
      documents: state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, status, processed_chunks: Math.round(doc.total_chunks * (progress / 100)) } : doc
      ),
    }))
  },

  clearError: () => {
    set({ error: null })
  },

  startPolling: () => {
    const { stopPolling } = get()
    stopPolling()
    
    const pollDocuments = async () => {
      const { documents, stopPolling } = get()
      const processingDocs = documents.filter(d =>
        d.status === 'pending' || d.status === 'processing'
      )
      
      if (processingDocs.length === 0) {
        stopPolling()
        return
      }
      
      await get().fetchDocuments()
    }
    
    const interval = setInterval(pollDocuments, 2000)
    set({ documentsPollingInterval: interval })
    pollDocuments()
  },

  stopPolling: () => {
    const { documentsPollingInterval } = get()
    if (documentsPollingInterval) {
      clearInterval(documentsPollingInterval)
      set({ documentsPollingInterval: null })
    }
  },
}))
