import axios from 'axios'
import { getDeviceId } from './device'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(async (config) => {
  const deviceId = await getDeviceId()
  config.headers['X-Device-Id'] = deviceId
  return config
})

export default api
