import 'dotenv/config'

// opcional: validación básica
if (!process.env.API_BASE_URL) {
  throw new Error('Missing API_URL env var')
}