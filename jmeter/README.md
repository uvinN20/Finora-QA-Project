# Finora JMeter Load Test

`Finora API Load Test.jmx` exercises two read-only authenticated endpoints: `GET /api/dashboard` and `GET /api/transactions?limit=20`. Both requests require a valid bearer token and assert HTTP 200.

## Safe test setup

1. Install Apache JMeter and a supported Java runtime.
2. Run Finora against a disposable development/test MongoDB database.
3. Register a dummy QA account and obtain a current JWT from the login API.
4. Do not use production URLs, real credentials, or production tokens.

## Example run

From this folder, provide the host, token, and load profile as JMeter properties:

```powershell
jmeter -n -t "Finora API Load Test.jmx" `
  -Jhost=127.0.0.1 -Jport=5000 `
  -JauthToken="REPLACE_WITH_A_TEST_TOKEN" `
  -Jthreads=10 -JrampUpSeconds=30 -Jiterations=5 `
  -l finora-load-results.jtl -e -o finora-load-report
```

The plan defaults to 10 virtual users, a 30-second ramp-up, and five iterations. Each user requests both endpoints five times, giving 50 requests per endpoint. Use a separate results file and empty report folder for each run.

## Recorded local runs

Date: 2026-11-23. Apache JMeter 5.6.3, Java 21, local Finora API, and isolated `finora_qa_automation` MongoDB database. All samples returned HTTP 200. The 1-user and 100-user profiles were run in this session; the 10-user and 50-user results are from the earlier local runs documented for this project.

| Users | Endpoint | Samples | Errors | Average (ms) | p95 (ms) | Max (ms) |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `/api/dashboard` | 5 | 0 | 13.60 | 34 | 34 |
| 1 | `/api/transactions?limit=20` | 5 | 0 | 7.00 | 8 | 8 |
| 10 | `/api/dashboard` | 50 | 0 | 9.46 | 15 | 46 |
| 10 | `/api/transactions?limit=20` | 50 | 0 | 7.36 | 10 | 13 |
| 50 | `/api/dashboard` | 250 | 0 | 7.81 | 13 | 31 |
| 50 | `/api/transactions?limit=20` | 250 | 0 | 6.72 | 10 | 18 |
| 100 | `/api/dashboard` | 500 | 0 | 8.39 | 12 | 29 |
| 100 | `/api/transactions?limit=20` | 500 | 0 | 7.51 | 10 | 13 |

The 100-user JMeter run completed 1,000 samples in 30 seconds at 33.6 samples/second, with 0 errors. The 1-user profile is a baseline with only five samples per endpoint, so its throughput is not meaningful. Those 2026-11-23 profiles were short local smoke runs. A separate sustained local benchmark is recorded below; neither run establishes a production SLA.

## Sustained local benchmark — 2026-11-24

The sustained plan is [`Finora Sustained API Benchmark.jmx`](Finora%20Sustained%20API%20Benchmark.jmx). It loops over the same two read-only endpoints until the configured duration expires. It was validated with a 10-second run, then run at 15, 20, 25, and 50 virtual users.

Example profile (use a token from a disposable QA account and a QA-only database):

```powershell
$props = Join-Path $env:TEMP 'finora-jmeter-user.properties'
@(
  'host=127.0.0.1',
  'port=5100',
  'authToken=REPLACE_WITH_A_TEST_TOKEN',
  'threads=15',
  'rampUpSeconds=60',
  'durationSeconds=360'
) | Set-Content -LiteralPath $props -Encoding ascii

jmeter -n -q $props -t 'Finora Sustained API Benchmark.jmx' `
  -l 'sustained-results.jtl'
```

The test properties file keeps the token out of the JMeter command arguments. Remove it after the run.

| Setting | Value |
|---|---|
| Load shape | Continuous requests, no think-time delay |
| Ramp-up | 60 seconds |
| Total thread-group duration | 360 seconds (about 5 minutes at full load after ramp-up) |
| Dataset | 5,000 synthetic transactions for one temporary QA user |
| Environment | Local Windows 11 Home, 10 CPU cores / 16 logical processors, 15.7 GB RAM; Java 25.0.4.1; Apache JMeter 5.6.3; isolated local MongoDB database |
| Endpoints | `GET /api/dashboard`, `GET /api/transactions?limit=20` |
| QA acceptance criteria | 0 failed samples and p95 ≤ 500 ms for each endpoint |

| Virtual users | Endpoint | Samples | Errors | Average (ms) | p95 (ms) | p99 (ms) | Max (ms) | Throughput (req/s) |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 15 | `/api/dashboard` | 19,236 | 0 | 200.36 | 340 | 387 | 513 | 53.45 |
| 15 | `/api/transactions?limit=20` | 19,224 | 0 | 58.37 | 108 | 126 | 3,841 | 53.42 |
| 20 | `/api/dashboard` | 18,647 | 0 | 271.59 | 468 | 530 | 10,543 | 51.81 |
| 20 | `/api/transactions?limit=20` | 18,631 | 2 | 83.88 | 151 | 175 | 15,004 | 51.78 |
| 25 | `/api/dashboard` | 17,939 | 0 | 351.22 | 591 | 651 | 3,013 | 49.84 |
| 25 | `/api/transactions?limit=20` | 17,922 | 0 | 110.48 | 193 | 220 | 2,630 | 49.80 |
| 50 | `/api/dashboard` | 22,140 | 0 | 500.47 | 1,608 | 1,966 | 4,369 | 61.52 |
| 50 | `/api/transactions?limit=20` | 22,103 | 0 | 247.47 | 679 | 812 | 3,278 | 61.42 |

At 15 virtual users, both endpoints met the selected p95 and zero-error criteria. At 20 users, dashboard p95 met the latency criterion, but two transaction requests timed out after 15 seconds, so the zero-error criterion failed. At 25 and 50 users, dashboard p95 exceeded 500 ms; transactions also exceeded 500 ms at 50 users. The highest tested profile that met both criteria was 15 virtual users under this continuous-request workload. This does not prove that 16 users fail or identify an exact capacity limit.

The profile deliberately has no think time, making it a stress-style read workload rather than a model of typical human browsing. The benchmark used a fresh QA-only database, and its temporary database, account, and transactions were removed afterward. A production-capacity claim still requires representative deployment hardware, production-sized data, realistic pacing, and an agreed service-level target. A compact CSV summary is available at [`results/sustained-benchmark-2026-11-24.csv`](results/sustained-benchmark-2026-11-24.csv).

The four measured profiles produced 155,842 samples total; two transaction samples timed out in the 20-user run. The separate 10-second plan validation produced 585 samples with no errors.
