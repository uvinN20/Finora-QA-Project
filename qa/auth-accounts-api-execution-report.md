# Auth and Accounts API execution report

**Date:** 2026-11-27  
**Execution type:** Automated black-box API checks  
**Cases:** TC-AUTH-01–10 and TC-ACCT-01–07  
**Latest result:** 17 passed, 0 failed, 0 blocked

## Latest run environment

- Workflow: [Uvin Auth and Accounts API checks — run 3](https://github.com/uvinN20/Finora-QA-Project/actions/runs/46032272092)
- Branch: `qa/uvin-plan-traceability-auth-accounts`
- Tested commit: `2f78bd7816f213b5277f5f27f715dcc3388b3053`
- Registration validation aligned with application commit: `17dc5d0640e3079c332875a5adc3ff6122710d0a`
- Runtime: GitHub-hosted Ubuntu runner with Node.js 20
- Database: disposable MongoDB `mongo:7` service for the workflow job
- Results artifact: [uvin-auth-accounts-api-results](https://github.com/uvinN20/Finora-QA-Project/actions/runs/46032272092#artifacts)

The workflow and artifact contain no passwords or bearer tokens. The job used isolated test data and did not use the local MongoDB database.

## Case results

| Case | Expected | Latest actual | Result |
|---|---|---|---|
| TC-AUTH-01 | Register returns 201; safe user, token, and one default Cash account | 201; all checks passed | Pass |
| TC-AUTH-02 | Each missing required field returns 400 | 400, 400, 400 | Pass |
| TC-AUTH-03 | Duplicate email returns 400 | 400 | Pass |
| TC-AUTH-04 | Malformed email is rejected and no account is created | 4xx; follow-up login returned 401 | Pass |
| TC-AUTH-05 | Five-character password is rejected and no account is created | 4xx; follow-up login returned 401 | Pass |
| TC-AUTH-06 | Six-character password registers successfully | 201; token and safe user returned | Pass |
| TC-AUTH-07 | Valid login returns 200, token, and safe user | 200; checks passed | Pass |
| TC-AUTH-08 | Wrong password returns 401 | 401 | Pass |
| TC-AUTH-09 | Protected account request without a token returns 401 | 401 | Pass |
| TC-AUTH-10 | Protected account request with invalid token returns 401 | 401 | Pass |
| TC-ACCT-01 | Own accounts returned; total equals summed balances | 200; ownership and total checks passed | Pass |
| TC-ACCT-02 | Savings account created for authenticated owner | 201; owner matched | Pass |
| TC-ACCT-03 | Account without name rejected | 400; account count unchanged | Pass |
| TC-ACCT-04 | Own account updated; owner and balance preserved | 200; checks passed | Pass |
| TC-ACCT-05 | Foreign account update returns 404; account unchanged | 404; unchanged | Pass |
| TC-ACCT-06 | Empty own account deleted | 200; removed from list | Pass |
| TC-ACCT-07 | Account with a transaction cannot be deleted | Transaction setup 201; delete returned 400; account remained | Pass |

## Defects and retest

The initial run [#1](https://github.com/uvinN20/Finora-QA-Project/actions/runs/46024265645) found two failures: malformed email was accepted with HTTP 201, and a five-character password resulted in HTTP 500. The QA branch backend copy was then aligned with the registration validation already present in the application repository.

The final run [#3](https://github.com/uvinN20/Finora-QA-Project/actions/runs/46032272092) passed both cases. The test runner now also attempts login after each rejected registration and expects HTTP 401, checking that a usable user record was not left behind. Validation runs before user creation; the default Cash account is only created after a user is created.

- [Issue #2: Registration accepts malformed email](https://github.com/uvinN20/Finora-QA-Project/issues/2) — closed after the passing retest.
- [Issue #3: Short registration password returns server error](https://github.com/uvinN20/Finora-QA-Project/issues/3) — closed after the passing retest.

## Manual execution status (user-reported)

On 2026-11-27, Uvin reported manually executing all 17 cases and observing **Pass** for each. The manual CSV records `Pass` for all 17, with the evidence reference `Manual execution reported by Uvin on 2026-11-27; details not attached`.

Per-case screenshots, response codes, tested build/commit, and execution environment were not supplied, so this records Uvin's report and does not independently verify the manual run.

The workflow runs on pushes to this QA branch that change `backend/**` or the API runner, and can also be started with `workflow_dispatch`.
