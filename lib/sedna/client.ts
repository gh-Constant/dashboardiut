import axios from 'axios'

const BASE_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc'

// Create an axios instance with default config
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
})

// Add request interceptor for rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second

client.interceptors.request.use(async (config) => {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }
  
  lastRequestTime = Date.now()
  return config
})

// Add response interceptor for error handling
client.interceptors.response.use(
  response => response,
  error => {
    console.error('Sedna API Error:', error)
    throw new Error(error.response?.data?.message || 'An error occurred while fetching data')
  }
)

export interface SednaRequestParams {
  departmentId?: string
  schoolId?: string
  classId?: string
  subclassId?: string
  semesterId?: string
}

export async function fetchDepartments() {
  return client.get('/mselect.jsp')
}

export async function fetchSchools(params: SednaRequestParams) {
  return client.post('/mselect.jsp', new URLSearchParams({
    departmentId: params.departmentId!,
    // Add any other required parameters
  }))
}

export async function fetchClasses(params: SednaRequestParams) {
  return client.post('/mselect.jsp', new URLSearchParams({
    departmentId: params.departmentId!,
    schoolId: params.schoolId!,
    // Add any other required parameters
  }))
}

export async function fetchSubclasses(params: SednaRequestParams) {
  return client.post('/mselect.jsp', new URLSearchParams({
    departmentId: params.departmentId!,
    schoolId: params.schoolId!,
    classId: params.classId!,
    // Add any other required parameters
  }))
}

export async function fetchSemesters(params: SednaRequestParams) {
  return client.post('/mselect.jsp', new URLSearchParams({
    departmentId: params.departmentId!,
    schoolId: params.schoolId!,
    classId: params.classId!,
    subclassId: params.subclassId!,
    // Add any other required parameters
  }))
}

export async function fetchSchedule(semesterId: string) {
  return client.get(`/mplanif.jsp?id=${semesterId}`)
}

export default client 