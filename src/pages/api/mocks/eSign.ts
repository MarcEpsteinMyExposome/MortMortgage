// Mock eSign flow (in-app sign or webhook simulation)
export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { applicationId, signer } = req.body
    // Return a stubbed signing URL and status
    return res.status(200).json({ applicationId, signer, signUrl: `https://demo.sign/${applicationId}/${signer}`, status: 'sent' })
  }
  res.status(405).end()
}
