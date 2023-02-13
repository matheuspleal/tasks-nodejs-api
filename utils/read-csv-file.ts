type Task = {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

export class ReadCSVFile {
  // constructor() {}

  isValid(): Boolean {
    return true
  }

  convertCSVtoJSON(csvString: string): any {}
}
