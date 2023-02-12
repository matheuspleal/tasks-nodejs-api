import path from 'node:path'
import { Database, OPEN_CREATE, OPEN_READWRITE } from 'sqlite3'

export const database = new Database(
  path.resolve(__dirname, '../db/app.db'),
  OPEN_READWRITE | OPEN_CREATE,
  (error) => {
    if (error) {
      throw new Error(error?.message)
    }
    database.run(
      `--sql
      create table if not exists tasks (
        id char(36) primary key, 
        title text not null, 
        description text not null,
        completed_at datetime null,
        created_at datetime not null,
        updated_at datetime not null
      )`,
    )
  },
)
