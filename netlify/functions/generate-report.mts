type PatientData = {
  age: number
  sex: number
  cp: number
  trestbps: number
  chol: number
  fbs: number
  restecg: number
  thalach: number
  exang: number
  oldpeak: number
  slope: number
  ca: number
  thal: number
}

type ReportData = {
  patient: PatientData
  probability: number
  risk_level: string
}

const escapePdfText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

const createPdf = (report: ReportData) => {
  const patient = report.patient
  const lines = [
    'CardioAI Diagnostics',
    'Cardiovascular Risk Assessment Report',
    '',
    `Age: ${Math.round(patient.age)} years`,
    `Sex: ${patient.sex === 1 ? 'Male' : 'Female'}`,
    `Resting Blood Pressure: ${Math.round(patient.trestbps)} mmHg`,
    `Serum Cholesterol: ${Math.round(patient.chol)} mg/dl`,
    `Max Heart Rate: ${Math.round(patient.thalach)} bpm`,
    `Chest Pain Type: ${Math.round(patient.cp)}`,
    `Oldpeak: ${patient.oldpeak}`,
    `Major Vessels: ${Math.round(patient.ca)}`,
    '',
    `Risk Probability: ${(report.probability * 100).toFixed(1)}%`,
    `Classification: ${report.risk_level.toUpperCase()} RISK`,
    '',
    'This report is for educational use only and is not a clinical diagnosis.',
  ]

  const textCommands = lines
    .map((line, index) => `BT /F1 ${index < 2 ? 18 : 11} Tf 72 ${760 - index * 24} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${textCommands.length} >> stream\n${textCommands}\nendstream endobj`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  }

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return pdf
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ detail: 'Method not allowed' }, { status: 405 })
  }

  let report: ReportData

  try {
    report = await req.json()
  } catch {
    return Response.json({ detail: 'Request body must be valid JSON.' }, { status: 400 })
  }

  if (!report?.patient || typeof report.probability !== 'number' || typeof report.risk_level !== 'string') {
    return Response.json({ detail: 'Missing report data.' }, { status: 400 })
  }

  return new Response(createPdf(report), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': 'attachment; filename=CardioAI_Risk_Report.pdf',
      'Content-Type': 'application/pdf',
    },
  })
}

export const config = {
  path: '/generate-report',
}
