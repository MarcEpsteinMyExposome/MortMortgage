// Mock credit bureau endpoint
export default function handler(req: any, res: any) {
  const scenario = req.query.scenario || 'good'

  const responses: any = {
    good: { score: 780, status: 'OK', history: 'Excellent' },
    average: { score: 660, status: 'OK', history: 'Some issues' },
    poor: { score: 540, status: 'BAD', history: 'Serious derogatories' }
  }

  res.status(200).json({ scenario, result: responses[scenario] })
}
