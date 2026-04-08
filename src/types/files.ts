export interface File {
  id: string
  filename: string
  mimeType: string
  size: number
  url: string
  createdAt: string
  updatedAt: string
}

export interface FileFilter {
  mimeType?: string
  startDate?: string
  endDate?: string
  minFileSize?: number
  maxFileSize?: number
  page?: number
  limit?: number
}

export interface VerificationDocuments {
  front?: FileDocument
  back?: FileDocument
  selfie?: FileDocument
}

export interface FileDocument {
  id: string
  fileId: string
  type: string
  url: string
}

