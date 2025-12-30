// Client-side file validation utilities
// This runs in the browser, so no Node.js dependencies

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/csv',
    'application/rtf',
    'text/markdown',
    'text/xml',
    'application/xml',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    // Image types
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ]
  const allowedExtensions = ['.txt', '.pdf', '.pptx', '.ppt', '.docx', '.doc', '.csv', '.rtf', '.md', '.xml', '.json', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg']
  
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: 'Please select supported file types: .txt, .pdf, .pptx, .ppt, .docx, .doc, .csv, .rtf, .md, .xml, .json, .xlsx, .xls, .png, .jpg, .jpeg, .gif, .webp, .bmp, .tiff, .tif, .svg'
    }
  }
  
  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024 // 20MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be under 20MB. Please choose a smaller file.'
    }
  }
  
  return { valid: true }
} 