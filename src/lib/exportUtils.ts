/**
 * Download a blob as a file
 * @param blob - The blob to download
 * @param filename - The filename for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Generate a filename with timestamp
 * @param prefix - The prefix for the filename (e.g., 'transactions')
 * @param extension - The file extension (e.g., 'csv', 'json')
 * @returns Formatted filename like 'transactions_2024-01-15.csv'
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}_${date}.${extension}`
}
