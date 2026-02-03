import { PrismaClient } from '@prisma/client'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false
  }
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export default async function handler(req: any, res: any) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid application ID' })
  }

  // Verify application exists
  const app = await prisma.application.findUnique({ where: { id } })
  if (!app) {
    return res.status(404).json({ error: 'Application not found' })
  }

  // GET - List documents for application
  if (req.method === 'GET') {
    try {
      const documents = await prisma.document.findMany({
        where: { applicationId: id },
        orderBy: { createdAt: 'desc' }
      })

      return res.status(200).json(documents)
    } catch (error) {
      console.error('Error fetching documents:', error)
      return res.status(500).json({ error: 'Failed to fetch documents' })
    }
  }

  // POST - Upload new document
  if (req.method === 'POST') {
    try {
      const form = formidable({
        uploadDir: UPLOAD_DIR,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024 // 10MB
      })

      const [fields, files] = await form.parse(req)

      const file = files.file?.[0]
      const documentType = fields.documentType?.[0] || 'other'

      if (!file) {
        return res.status(400).json({ error: 'No file provided' })
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!allowedTypes.includes(file.mimetype || '')) {
        // Delete the uploaded file
        fs.unlinkSync(file.filepath)
        return res.status(400).json({ error: 'Invalid file type' })
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          applicationId: id,
          filename: file.originalFilename || 'document',
          contentType: file.mimetype || 'application/octet-stream',
          path: file.filepath,
          documentType
        }
      })

      return res.status(201).json(document)
    } catch (error) {
      console.error('Error uploading document:', error)
      return res.status(500).json({ error: 'Failed to upload document' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
