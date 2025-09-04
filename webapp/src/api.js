export async function pingCatalog() {
  const res = await fetch('/catalog/api/health');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
