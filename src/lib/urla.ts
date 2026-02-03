// URLA 2020 helper placeholder
// TODO: Provide full URLA field builder & PDF generation
export function buildURLA(application: any) {
  return {
    url: '2020',
    applicationId: application.id,
    parties: application.borrowers
  }
}
