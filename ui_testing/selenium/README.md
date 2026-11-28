# Finora Selenium UI smoke test

This Selenium smoke flow covers the main browser journey: register a disposable LKR QA user, add a LKR 100 income transaction, confirm it appears in the Transactions page, then verify the Dashboard total balance includes it.

## Prerequisites

- Node.js 22 or newer.
- Finora backend and MongoDB running.
- Finora frontend running at `http://localhost:5173` (or set `FINORA_BASE_URL`).
- Microsoft Edge installed.

Selenium Manager handles the matching Edge driver; no separate ChromeDriver download is needed.

## Run

From this directory:

```sh
npm install
npm run test:smoke
```

To run without opening a visible browser window:

```sh
HEADLESS=1 npm run test:smoke
```

PowerShell:

```powershell
$env:HEADLESS = "1"
npm run test:smoke
```

The flow prints a PASS line after registration, transaction creation, and dashboard balance verification. Each run creates a new user and transaction that remain in MongoDB. Run against a development/test database only; no test user is automatically deleted.

This test uses visible UI elements and is a basic smoke check. It does not replace broader regression, accessibility, or negative-path testing.
