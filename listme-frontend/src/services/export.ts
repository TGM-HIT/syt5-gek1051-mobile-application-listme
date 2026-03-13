import api from './api'

export const exportService = {
  async download(listId: string, format: 'csv' | 'pdf', listName: string) {
    const response = await api.get(`/lists/${listId}/export`, {
      params: { format },
      responseType: 'blob',
    })

    const ext = format === 'pdf' ? 'pdf' : 'csv'
    const filename = `${listName.replace(/[^a-z0-9äöüß ]/gi, '').trim() || 'liste'}.${ext}`

    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
