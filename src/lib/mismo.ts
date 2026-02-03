// Minimal MISMO helper (placeholder)
// TODO: Implement full MISMO v3.x mapping from internal URLA JSON to MISMO JSON/XML.

export function toMISMO(application: any) {
  // For demo, return a minimal MISMO-like JSON object
  return {
    version: '3.x-demo',
    loan: {
      id: application.id,
      product: application.data?.product || 'Conventional'
    },
    borrowers: application.borrowers || []
  }
}
