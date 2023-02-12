import './database'
import http, { IncomingMessage, ServerResponse } from 'node:http'
import { json } from './middlewares/json'

const server = http.createServer(
  async (request: IncomingMessage, response: ServerResponse) => {
    await json(request, response)
    response.writeHead(200).end()
  },
)

server.listen(3333, () => {
  console.log('Server running on 3333!')
})
