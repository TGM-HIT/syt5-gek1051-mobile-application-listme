import axios from 'axios'
import { getDeviceId } from './device'
import { getUserId } from './userId'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

api.interceptors.request.use(async (config) => {
  const deviceId = await getDeviceId()
  config.headers['X-Device-Id'] = deviceId
  const userId = getUserId()
  if (userId) config.headers['X-User-Id'] = userId
  return config
})

export default api
