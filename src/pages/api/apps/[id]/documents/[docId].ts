import { prisma } from '../../../../../lib/prisma'
import { isVercel } from '../../../../../lib/env'
import fs from 'fs'

export default async function handler(req: any, res: any) {
  const { id, docId } = req.query

  if (!id || !docId || typeof id !== 'string' || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid IDs' })
  }

  // Verify document exists and belongs to the application
  const document = await prisma.document.findFirst({
    where: { id: docId, applicationId: id }
  })

  if (!document) {
    return res.status(404).json({ error: 'Document not found' })
  }

  // GET - Download/view document
  if (req.method === 'GET') {
    try {
      // Check if file exists
      if (isVercel || !fs.existsSync(document.path)) {
        return res.status(404).json({ error: 'File not found on disk' })
      }

      // Set appropriate headers
      res.setHeader('Content-Type', document.contentType)
      res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`)

      // Stream the file
      const fileStream = fs.createReadStream(document.path)
      fileStream.pipe(res)
    } catch (error) {
      console.error('Error serving document:', error)
      return res.status(500).json({ error: 'Failed to serve document' })
    }
  }

  // DELETE - Remove document
  else if (req.method === 'DELETE') {
    try {
      // Delete file from disk (skip on Vercel — no local files)
      if (!isVercel && fs.existsSync(document.path)) {
        fs.unlinkSync(document.path)
      }

      // Delete database record
      await prisma.document.delete({
        where: { id: docId }
      })

      return res.status(204).end()
    } catch (error) {
      console.error('Error deleting document:', error)
      return res.status(500).json({ error: 'Failed to delete document' })
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
