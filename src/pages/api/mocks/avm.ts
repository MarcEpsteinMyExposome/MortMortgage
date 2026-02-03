// Mock AVM/property valuation endpoint
export default function handler(req: any, res: any) {
  const scenario = req.query.scenario || 'median'
  const responses: any = {
    high: { value: 650000, confidence: 0.9 },
    median: { value: 450000, confidence: 0.8 },
    low: { value: 300000, confidence: 0.7 }
  }
  res.status(200).json({ scenario, result: responses[scenario] })
}
