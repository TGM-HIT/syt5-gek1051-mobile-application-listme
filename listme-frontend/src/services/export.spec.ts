import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('./api', () => ({ default: { get: mockGet } }))

import { exportService } from './export'

describe('exportService', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let mockClick: ReturnType<typeof vi.fn>
  let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()

    mockClick = vi.fn()
    mockAnchor = { href: '', download: '', click: mockClick }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)

    createObjectURL = vi.fn().mockReturnValue('blob:fake-url')
    revokeObjectURL = vi.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL
  })

  it('calls GET with correct params for csv', async () => {
    const blob = new Blob(['a,b'], { type: 'text/csv' })
    mockGet.mockResolvedValue({ data: blob })

    await exportService.download('l1', 'csv', 'Meine Liste')

    expect(mockGet).toHaveBeenCalledWith('/lists/l1/export', { params: { format: 'csv' }, responseType: 'blob' })
  })

  it('calls GET with correct params for pdf', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    mockGet.mockResolvedValue({ data: blob })

    await exportService.download('l1', 'pdf', 'Meine Liste')

    expect(mockGet).toHaveBeenCalledWith('/lists/l1/export', { params: { format: 'pdf' }, responseType: 'blob' })
  })

  it('sets anchor download to sanitized filename with csv extension', async () => {
    mockGet.mockResolvedValue({ data: new Blob() })
    await exportService.download('l1', 'csv', 'Einkauf März')
    expect(mockAnchor.download).toMatch(/\.csv$/)
  })

  it('sets anchor download to filename with pdf extension', async () => {
    mockGet.mockResolvedValue({ data: new Blob() })
    await exportService.download('l1', 'pdf', 'Wochenmarkt')
    expect(mockAnchor.download).toMatch(/\.pdf$/)
  })

  it('uses fallback filename when name has only special chars', async () => {
    mockGet.mockResolvedValue({ data: new Blob() })
    await exportService.download('l1', 'csv', '!!!???')
    expect(mockAnchor.download).toBe('liste.csv')
  })

  it('clicks the anchor to trigger download', async () => {
    mockGet.mockResolvedValue({ data: new Blob() })
    await exportService.download('l1', 'csv', 'Test')
    expect(mockClick).toHaveBeenCalled()
  })

  it('revokes the object URL after download', async () => {
    mockGet.mockResolvedValue({ data: new Blob() })
    await exportService.download('l1', 'csv', 'Test')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})
