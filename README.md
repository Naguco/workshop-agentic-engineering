# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

## CI/CD Integration Tests Against Third-Party Systems

This project includes a proof-of-concept that runs CAP integration tests making **real
calls** to the external systems the app integrates with — SAP SuccessFactors
(`PLTUserManagement`) and SAP AI Core (`aicore`) — through the BTP **destination service**,
the same way the app reaches them in production. Credentials are resolved live from the
cloud at test time; none are stored in the repo.

### What it proves

- `test/integration/successfactors.integration.test.js` reads `SFSF_User` through the
  `PLTUserManagement` destination and asserts a well-formed live response (HTTP 200).
- `test/integration/aicore.integration.test.js` invokes the `Project/summarize` action so a
  real prompt is sent to AI Core, and asserts a non-empty completion comes back.

Both fail loudly if the destination/credential resolution did not happen, so a green run
genuinely means the external systems were reached.

### How credentials are resolved

The `integration-test` CDS profile (in `package.json` under `cds.requires`) declares the
external services by destination and binds the `destination-service` instance. The tests run
under `cds bind --exec`, which resolves the binding from the cloud and exposes it via
`VCAP_SERVICES` so the SAP Cloud SDK can look up the destinations. This is wired into the
npm script:

```
npm run integration-test
```

> The script wraps Jest with `cds bind --exec --profile integration-test` and enables
> `--experimental-vm-modules` (needed because the AI SDK is loaded via dynamic ESM `import()`).

### Run it locally

```sh
cf api https://api.cf.<region>.hana.ondemand.com
cf login            # or: cf auth "$CF_USER" "$CF_PASSWORD"
cf target -o <org> -s <space>
npm run integration-test
```

The `destination-service` instance and its `destination-service-key` service key must exist
in the targeted space, and the `PLTUserManagement` and `aicore` destinations must be
configured in the subaccount.

### Run it in CI (GitHub Actions)

The workflow `.github/workflows/integration-tests.yml` reproduces the above on a runner. It
is triggered manually (**Actions → Integration Tests (third-party systems) → Run workflow**).

Configure these repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `CF_API` | CF API endpoint, e.g. `https://api.cf.eu10-004.hana.ondemand.com` |
| `CF_USER` | Technical user for `cf auth` |
| `CF_PASSWORD` | Password for that user |
| `CF_ORG` | Target org |
| `CF_SPACE` | Target space |

### Confirming the calls were live

In the workflow run, open the **Run integration tests** step log. A successful run shows:

- `bound destinations to cf managed service destination-service:destination-service-key`
  (the destination service was resolved), and
- `[AI] Response received: ...` with a real summary (AI Core answered), and
- `Tests: 2 passed, 2 total`.

If the destination binding is missing, the tests error with
`Could not find service binding of type 'destination'` and the step fails — the pipeline
cannot go green without the live calls succeeding.

### Note on the local unit tests

`npm test` runs the offline unit tests only (`test/ai.test.js`); the live integration tests
under `test/integration/` are excluded from that run and execute solely via
`npm run integration-test`.
