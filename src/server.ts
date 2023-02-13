import './database'
import http, { ServerResponse } from 'node:http'
import { json } from './middlewares/json'
import { routes } from './routes'
import { ClientRequest } from './http-protocol'
import { extractQueryParams } from '../utils/extract-query-params'

export type RouteParams = {
  query?: string
  params?: string
}

const server = http.createServer(
  async (request: ClientRequest, response: ServerResponse) => {
    await json(request, response)
    const { method, url } = request

    const route = routes.find(
      (route) => route.method === method && route.path.test(url!),
    )

    if (route) {
      const routeParams = request?.url?.match(route.path)
      const { query, ...params } = routeParams?.groups as RouteParams
      request.params = params
      request.query = query ? extractQueryParams(query) : {}
      return route.handler(request, response)
    }

    return response.writeHead(404).end()
  },
)

server.listen(3333, () => {
  console.log('🐙 Server running on 3333!')
})
