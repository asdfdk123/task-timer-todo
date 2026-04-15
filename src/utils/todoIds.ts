function getRandomUint32() {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(1)
    globalThis.crypto.getRandomValues(values)

    return values[0]
  }

  return Math.floor(Math.random() * 2 ** 32)
}

export function createTodoId(existingIds: Iterable<number>) {
  const usedIds = new Set(existingIds)
  let nextId = getRandomUint32()

  while (nextId === 0 || usedIds.has(nextId)) {
    nextId = getRandomUint32()
  }

  return nextId
}
