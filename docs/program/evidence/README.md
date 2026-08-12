# Four-Lens Independent Acceptance Evidence

Lane 06 stores one tracked JSON manifest per accepted candidate at `docs/program/evidence/<candidate-sha>.json`. A manifest is evidence metadata, not a substitute for its referenced GitHub Actions run or durable artifacts.

The schema is:

```json
{
  "schemaVersion": 1,
  "candidateSha": "40-character accepted implementation SHA",
  "baseSha": "40-character merged-main SHA declared by the Lane 06 packet",
  "producer": {
    "lane": "independent-acceptance",
    "reviewer": "identity distinct from the implementation actor"
  },
  "runUrl": "https://github.com/AccelAnalysis/RFxchange/actions/runs/<run-id>",
  "environment": {
    "name": "configured environment name",
    "configurationReference": "tracked repository path or HTTPS reference"
  },
  "checks": [
    {
      "type": "one declared acceptance type",
      "method": "executed command or participant journey",
      "result": "passed",
      "observedAt": "ISO-8601 timestamp",
      "artifacts": ["tracked repository path or HTTPS artifact reference"]
    }
  ]
}
```

The ledger maps each Verified acceptance type to this manifest. Validation rejects a manifest whose filename, candidate, base, producer, run, environment, time, result or artifacts do not satisfy the exact candidate and declared Lane 06 packet.
