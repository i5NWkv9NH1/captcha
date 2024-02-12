export function createKey(): string {
  const getHex = () => Number.parseInt(String(Math.random() * 256)).toString(16).padStart(2, '0')
  return `${getHex()}${getHex()}${getHex()}-${Date.now()}`
}
