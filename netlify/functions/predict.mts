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

const requiredFields: Array<keyof PatientData> = [
  'age',
  'sex',
  'cp',
  'trestbps',
  'chol',
  'fbs',
  'restecg',
  'thalach',
  'exang',
  'oldpeak',
  'slope',
  'ca',
  'thal',
]

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    headers: {
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
    status: init?.status,
    statusText: init?.statusText,
  })

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

const normalize = (value: number, low: number, high: number) =>
  clamp((value - low) / (high - low))

const estimateRisk = (data: PatientData) => {
  const risk =
    0.08 +
    normalize(data.age, 35, 80) * 0.18 +
    (data.sex === 1 ? 0.05 : 0) +
    normalize(data.cp, 0, 3) * 0.09 +
    normalize(data.trestbps, 100, 180) * 0.11 +
    normalize(data.chol, 150, 320) * 0.1 +
    (data.fbs === 1 ? 0.04 : 0) +
    normalize(data.restecg, 0, 2) * 0.04 +
    (1 - normalize(data.thalach, 90, 200)) * 0.12 +
    (data.exang === 1 ? 0.08 : 0) +
    normalize(data.oldpeak, 0, 6) * 0.09 +
    normalize(data.slope, 0, 2) * 0.04 +
    normalize(data.ca, 0, 4) * 0.08 +
    normalize(data.thal, 0, 3) * 0.06

  return clamp(risk)
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ detail: 'Method not allowed' }, { status: 405 })
  }

  let payload: Partial<PatientData>

  try {
    payload = await req.json()
  } catch {
    return json({ detail: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const missingField = requiredFields.find((field) => {
    const value = payload[field]
    return typeof value !== 'number' || Number.isNaN(value)
  })

  if (missingField) {
    return json({ detail: `Missing or invalid field: ${missingField}` }, { status: 400 })
  }

  const patient = payload as PatientData
  const probability = estimateRisk(patient)
  const risk_level = probability > 0.7 ? 'High' : probability < 0.3 ? 'Low' : 'Moderate'

  return json({ probability, risk_level })
}

export const config = {
  path: '/predict',
}
