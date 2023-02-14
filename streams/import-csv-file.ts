type Task = {
  title: string
  description: string
}

export class ImportCSVFile {
  // constructor() {}

  isValid(): Boolean {
    return true
  }

  convertCSVtoJSON(csvString: string): Task[] {}

  async sendToAPI(tasks: Task[]): Promise<void> {
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
}
