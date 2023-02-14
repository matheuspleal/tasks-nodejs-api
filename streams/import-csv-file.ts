import { readFile } from 'node:fs'
import path from 'node:path'

type Task = {
  title: string
  description: string
}

const DEFAULT_OPTIONS = {
  fields: ['title', 'description'],
}

export class ImportCSVFile {
  private isValid(csvText: string): boolean {
    const [header] = csvText.split('\n')
    const isHeaderValid = header === DEFAULT_OPTIONS.fields.join(',')
    if (!isHeaderValid) {
      return false
    }
    return true
  }

  private async sendToAPI(tasks: Task[]): Promise<void> {
    for (const { title, description } of tasks) {
      await fetch('http://localhost:3333/tasks', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      })
    }
  }

  private convertCSVtoJSON(csvText: string): Task[] {
    const lines = csvText.split('\n')
    const firstLine = lines.shift()
    const header = firstLine!.split(',')
    const tasks = lines.map((line) => {
      const columns = line.split(',')
      const task = {} as any
      for (const index in columns) {
        task[header[index]] = columns[index]
      }
      return {
        title: task.title,
        description: task.description,
      }
    })
    return tasks
  }

  public async startImport(filePath: string): Promise<void> {
    const csvText = (await new Promise((resolve, reject) => {
      readFile(filePath, 'utf8', (error, data) => {
        if (error) reject(new Error())
        resolve(data)
      })
    })) as string

    const isValid = this.isValid(csvText)

    if (!isValid) {
      throw new Error('Invalid headers')
    }

    const tasks = this.convertCSVtoJSON(csvText)
    this.sendToAPI(tasks)
  }
}

const importCSV = new ImportCSVFile()
importCSV.startImport(path.resolve('streams/tasks.csv'))
