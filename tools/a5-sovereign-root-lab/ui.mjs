const response = await fetch("/demo.json");
if (!response.ok) throw new Error("TEST_DEMO_UNAVAILABLE");
const { intent, digest } = await response.json();
if (intent.version !== "TEST_A5_INTENT_V1" || intent.providerProjectRef !== "TEST_ONLY")
  throw new Error("TEST_ONLY");
for (const [id, value] of Object.entries({
  project: intent.providerProjectRef,
  source: intent.sourceSha,
  manifest: intent.manifestSha256,
  intent: digest,
})) {
  document.getElementById(id).textContent = value;
}
intent.migrationVersions.forEach((version, index) => {
  const item = document.createElement("li");
  item.textContent = `${version} · SHA-256 ${intent.migrationSha256[index]}`;
  document.getElementById("migrations").appendChild(item);
});
