import { IncomingMessage, ServerResponse } from 'node:http'

export type ClientRequest = IncomingMessage & {
  body?: any
}

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
