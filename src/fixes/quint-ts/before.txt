export function createSearch(fetchResults: (query: string) => Promise<string[]>) {
  const state = { query: '', results: [] as string[] };

  async function onInput(query: string): Promise<void> {
    state.query = query;
    const results = await fetchResults(query);
    state.results = results;
  }

  return { state, onInput };
}
