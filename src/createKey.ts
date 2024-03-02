import { v4 as uuid } from 'uuid'

export function createKey() {
  return uuid()
}
