import { IncomingMessage } from 'node:http'

export type ClientRequest = IncomingMessage & {
  params?: any
  query?: any
  body?: any
}
