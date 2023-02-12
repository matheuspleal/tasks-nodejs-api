import { ServerResponse } from 'node:http'
import { ClientRequest } from '../http-protocol'

export async function json(request: ClientRequest, response: ServerResponse) {
  const buffers: Buffer[] = []

  for await (const chunk of request) {
    buffers.push(chunk)
  }

  try {
    request.body = JSON.parse(Buffer.concat(buffers).toString())
  } catch {
    request.body = null
  }

  response.setHeader('Content-type', 'application/json')
}
