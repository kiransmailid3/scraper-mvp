import { useState } from 'react';


export default function Home() {
const [q, setQ] = useState('mjolk');
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);


const search = async (e) => {
e?.preventDefault();
setLoading(true);
setResult(null);
try {
const res = await fetch(`/api/scrape?q=${encodeURIComponent(q)}`);
const data = await res.json();
setResult(data);
} catch (err) {
setResult({ error: err.message });
}
setLoading(false);
};


return (
<main style={{ padding: 20 }}>
<h1>Grocery Scraper — ICA (single-item)</h1>
<form onSubmit={search}>
<input value={q} onChange={(e) => setQ(e.target.value)} />
<button type="submit">Search</button>
</form>


{loading && <p>Loading…</p>}
{result && (
<pre style={{ background: '#f6f6f6', padding: 12 }}>{JSON.stringify(result, null, 2)}</pre>
)}
</main>
);
}
