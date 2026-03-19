export async function processInChunks<T, R>(
  items: readonly T[],
  chunkSize: number,
  processor: (chunk: readonly T[], chunkIndex: number) => Promise<readonly R[]>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const safeChunkSize = Math.max(1, chunkSize);
  const results: R[] = [];

  for (
    let i = 0, chunkIndex = 0;
    i < items.length;
    i += safeChunkSize, chunkIndex += 1
  ) {
    const chunk = items.slice(i, i + safeChunkSize);
    const chunkResult = await processor(chunk, chunkIndex);
    results.push(...chunkResult);
  }

  return results;
}
