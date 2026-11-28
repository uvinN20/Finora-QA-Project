# Finora QA Test Plan

## 1. Purpose

This plan defines how the group will verify Finora against its documented user and API behaviour. It sets the test scope, test approach, environment, entry and exit criteria, evidence rules, and ownership. This branch contains Uvin's planning and traceability contribution plus the 17 Authentication and Accounts test designs assigned to him. Test cases remain **Not Run** until a tester executes them and records evidence.

## 2. System under test

Finora is a personal finance tracker with a Node.js/Express/MongoDB backend and a React/Vite frontend. The backend exposes a JSON API on `http://localhost:5000`; its health route is `GET /api/health`. The frontend development server is configured for `http://localhost:5173`. The repository README currently says that the frontend page screens and routes have been removed and that it renders no page content. Therefore, current execution should prioritize API behaviour; UI checks require the screens/routes to be restored or must be recorded as blocked.

Core capabilities documented in the repository are authentication, accounts and transfers, transactions, budgets, savings goals, dashboard summaries, and reports.

## 3. Objectives

- Check that valid user and account operations produce the documented outcomes.
- Check required-field, format, boundary, authentication, and ownership failures.
- Confirm one user's data cannot be read or changed by another user.
- Check that financial totals and account balances remain consistent across operations.
- Record reproducible evidence for each executed case and raise defects with steps, expected/actual results, severity, and an owner.

## 4. Scope

### In scope

- Authentication: registration, duplicate/invalid data, password length, login, and protected API access.
- Accounts: list and total, create, update, ownership isolation, and delete restrictions.
- Group coverage also includes transactions, transfers, budgets, savings goals, dashboard, reports, security, performance, and CI/SonarQube. Their detailed cases and execution evidence are owned by the assigned group members and are linked in the RTM.

### Out of scope

Production deployment, real financial data, third-party penetration testing, formal accessibility certification, and production-scale capacity certification.

## 5. Test approach

- **Black-box API testing:** send requests through the exposed API without relying on controller internals. Use valid, invalid, boundary, and cross-user data.
- **Integration testing:** verify persistence and relationships against a dedicated QA MongoDB database.
- **Manual execution:** use Postman for API cases and the browser for UI cases when the UI is available.
- **Automation and static analysis:** use the test, CI, and SonarQube checks added by the group. A test is not considered executed merely because an automated reference exists.
- **Regression:** rerun affected cases after a fix and record the new result separately from the original result.

## 6. Test environment and data

- Node.js 18.11 or later, MongoDB running locally or an isolated MongoDB Atlas test database.
- Backend configuration copied from `backend/.env.example`; do not commit `.env`, passwords, JWT secrets, tokens, or real user data.
- Start the backend from `backend` with `npm install` and `npm run dev`. Start the frontend from `frontend` with `npm install` and `npm run dev` if UI execution is available.
- Use disposable test users with unique email addresses. Use at least two users for ownership checks and separate accounts for list/update/delete tests.
- Keep test records in the QA database only. Do not use personal bank credentials or real financial records.

## 7. Entry and exit criteria

### Entry

- The tested branch and commit are recorded.
- The API starts and `GET /api/health` returns HTTP 200 with `{"status":"ok"}`.
- MongoDB is connected to a dedicated test database.
- Test data is isolated and the relevant test case has an owner.

### Exit

- Every in-scope case has a recorded status (`Pass`, `Fail`, `Blocked`, or `Not Run`) and evidence reference when executed.
- Failures have a defect record; fixes have a linked regression check.
- No case is marked `Pass` without an observed actual result.
- High-severity defects are fixed or explicitly documented as open, with impact and owner.
- The final report distinguishes API, browser, and automated evidence and states remaining limits.

## 8. Result and defect rules

Use `Not Run` until execution. Record the request/response, screenshot, test log, or commit/CI link as appropriate. A `Fail` means the observed behaviour differs from the expected result. A `Blocked` result requires the blocking condition. Do not store bearer tokens in screenshots or repository files. Raise defects in GitHub with a minimal reproduction, expected/actual behaviour, environment, evidence, and severity.

## 9. Group work allocation

| Member | Main responsibility | Planned cases |
|---|---|---|
| Uvin | Test plan, RTM, black-box design, Authentication and Accounts | `TC-AUTH-01–10`, `TC-ACCT-01–07` |
| Dilshan | Postman/Newman and API/backend coverage for transactions and transfers | `TC-TXN-01–15`, `TC-ACCT-08–10` |
| Tharuka | Browser/UI and Selenium coverage for budgets and savings goals | `TC-BUD-01–08`, `TC-GOAL-01–07` |
| Hansitha | Dashboard/reports plus white-box, security, performance, CI and SonarQube | `TC-DASH-01–05`, `TC-REP-01–05` |

Each member should work on a feature branch, make commits under their own GitHub account, open a pull request to `main`, and have another member review it. This document does not claim that the planned manual cases have already been executed.

## 10. Known test risks

- The User model enforces a six-character password minimum but does not declare an email-format validator. `TC-AUTH-04` is intended to check that malformed email input is rejected; actual implementation may expose a validation gap.
- Mongoose validation errors are passed to a generic error handler that defaults to HTTP 500 unless a status was set. Validation cases must check both correctness and whether client errors receive an appropriate 4xx response.
- Account creation applies `balance || 0` and the schema has no non-negative balance rule. Boundary cases should check zero, positive, and negative starting balances.
- The account transfer controller performs sequential saves. This plan checks ordinary transfer outcomes; atomicity under concurrent requests or database failure needs separate verification.
- The frontend currently renders no page content according to the repository README, which may block browser testing.

