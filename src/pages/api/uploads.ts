// Simple file upload stub for demo. Files saved under ./uploads as path reference only.
import fs from 'fs'
import path from 'path'

export const config = {
  api: { bodyParser: false }
}

export default async function handler(req: any, res: any) {
  // For a demo we accept a single multipart upload in memory and write to disk.
  // In production you'd use a proper file parser (multer, busboy) and secure storage.
  if (req.method !== 'POST') return res.status(405).end()

  // NOTE: This is a stub. You can wire up formidable or busboy in follow-up.
  res.status(200).json({ message: 'Upload endpoint stubbed. Use test fixtures.' })
}
