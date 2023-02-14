import { randomUUID } from 'node:crypto'
import { ServerResponse, IncomingMessage } from 'node:http'
import { buildRoutePath } from './utils/build-route-path'
import { database } from './database'
import { ClientRequest } from './http-protocol'

type Task = {
  id: string
  title: string
  description: string
  completed_at?: string | null
  created_at: string
  updated_at: string
}

type FoundTask = {
  id?: string
  title?: string
  description?: string
  completed_at?: string
}

type UpdatedTask = {
  id: string
  title: string
  description: string
  updated_at: string
}

type CompletedTask = {
  id: string
  completed_at: string
}

type Route = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: RegExp
  handler: (
    request: ClientRequest,
    response: ServerResponse,
  ) => Promise<ServerResponse<IncomingMessage>>
}

export const routes: Route[] = [
  {
    method: 'POST',
    path: buildRoutePath('/tasks'),
    handler: async (
      request: ClientRequest,
      response: ServerResponse,
    ): Promise<ServerResponse<IncomingMessage>> => {
      const { title, description } = request.body

      if (!title || !description) {
        return response.writeHead(400).end(
          JSON.stringify({
            message: 'The title and description parameters are required.',
          }),
        )
      }

      if (typeof title !== 'string' || typeof description !== 'string') {
        return response.writeHead(400).end(
          JSON.stringify({
            message:
              'The title and description parameters must be of type string.',
          }),
        )
      }

      const currentDate = new Date().toISOString()

      const newTask: Task = {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: currentDate,
        updated_at: currentDate,
      }

      return new Promise((resolve, reject) => {
        database.run(
          `--sql
          insert into tasks (
            id,
            title, 
            description,
            completed_at,
            created_at,
            updated_at
          ) values (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
          [
            newTask.id,
            newTask.title,
            newTask.description,
            newTask.completed_at,
            newTask.created_at,
            newTask.updated_at,
          ],
          (error: Error | null) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(response.writeHead(201).end())
          },
        )
      })
    },
  },
  {
    method: 'GET',
    path: buildRoutePath('/tasks'),
    handler: async (
      request: ClientRequest,
      response: ServerResponse,
    ): Promise<ServerResponse<IncomingMessage>> => {
      const { title, description } = request.query

      if (!title && !description) {
        return new Promise((resolve, reject) => {
          database.all(
            `--sql
            select * from tasks
          `,
            (error: Error | null, rows: any[]) => {
              if (error) {
                return reject(new Error(error.message))
              }
              return resolve(
                response.writeHead(200).end(
                  JSON.stringify({
                    tasks: [...rows],
                  }),
                ),
              )
            },
          )
        })
      }

      return new Promise((resolve, reject) => {
        database.all(
          `--sql
          select * from tasks where title = ? and description = ?
        `,
          [title, description],
          (error: Error | null, rows: any[]) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(
              response.writeHead(200).end(
                JSON.stringify({
                  tasks: [...rows],
                }),
              ),
            )
          },
        )
      })
    },
  },
  {
    method: 'PUT',
    path: buildRoutePath('/tasks/:id'),
    handler: async (
      request: ClientRequest,
      response: ServerResponse,
    ): Promise<ServerResponse<IncomingMessage>> => {
      const { id } = request.params

      const { title, description } = request.body

      if (!title && !description) {
        return response.writeHead(400).end(
          JSON.stringify({
            message:
              'The title or description parameters are required to update a task.',
          }),
        )
      }

      const foundTask = (await new Promise((resolve, reject) => {
        database.get(
          `--sql
          select id, title, description from tasks where id = ?
        `,
          [id],
          (error: Error | null, row: any) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(row)
          },
        )
      })) as FoundTask

      if (!foundTask?.id) {
        return response.writeHead(400).end(
          JSON.stringify({
            message: 'Task id does not exists in database.',
          }),
        )
      }

      const updatedTask: UpdatedTask = {
        id: foundTask.id,
        title: title ?? foundTask.title,
        description: description ?? foundTask.description,
        updated_at: new Date().toISOString(),
      }

      return new Promise((resolve, reject) => {
        database.run(
          `--sql
          update tasks set title = ?, description = ?, updated_at = ? where id = ?
        `,
          [
            updatedTask.title,
            updatedTask.description,
            updatedTask.updated_at,
            updatedTask.id,
          ],
          (error: Error | null, row: any) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(response.writeHead(204).end())
          },
        )
      })
    },
  },
  {
    method: 'DELETE',
    path: buildRoutePath('/tasks/:id'),
    handler: async (
      request: ClientRequest,
      response: ServerResponse,
    ): Promise<ServerResponse<IncomingMessage>> => {
      const { id } = request.params

      const foundTask = (await new Promise((resolve, reject) => {
        database.get(
          `--sql
          select id from tasks where id = ?
        `,
          [id],
          (error: Error | null, row: any) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(row)
          },
        )
      })) as FoundTask

      if (!foundTask?.id) {
        return response.writeHead(400).end(
          JSON.stringify({
            message: 'Task id does not exists in database.',
          }),
        )
      }

      return new Promise((resolve, reject) => {
        database.run(
          `--sql
          delete from tasks where id = ?
        `,
          [foundTask.id],
          (error: Error | null, row: any) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(response.writeHead(204).end())
          },
        )
      })
    },
  },
  {
    method: 'PATCH',
    path: buildRoutePath('/tasks/:id/complete'),
    handler: async (
      request: ClientRequest,
      response: ServerResponse,
    ): Promise<ServerResponse<IncomingMessage>> => {
      const { id } = request.params

      const foundTask = (await new Promise((resolve, reject) => {
        database.get(
          `--sql
          select id, completed_at, description from tasks where id = ?
        `,
          [id],
          (error: Error | null, row: any) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(row)
          },
        )
      })) as FoundTask

      if (!foundTask?.id) {
        return response.writeHead(400).end(
          JSON.stringify({
            message: 'Task id does not exists in database.',
          }),
        )
      }

      if (foundTask?.completed_at) {
        return response.writeHead(400).end(
          JSON.stringify({
            message: `The task has already been completed in: ${foundTask.completed_at}`,
          }),
        )
      }

      const currentDate = new Date().toISOString()

      const completedTask: CompletedTask = {
        id,
        completed_at: currentDate,
      }

      return new Promise((resolve, reject) => {
        database.run(
          `--sql
          update tasks set completed_at = ? where id = ?
        `,
          [completedTask.completed_at, completedTask.id],
          (error: Error | null, row: any) => {
            if (error) {
              reject(new Error(error.message))
            }
            resolve(response.writeHead(204).end())
          },
        )
      })
    },
  },
]
