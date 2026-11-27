# Auth and Accounts API execution report

**Date:** 2026-11-27  
**Execution type:** Automated black-box API checks  
**Cases:** TC-AUTH-01–10 and TC-ACCT-01–07  
**Result:** 15 passed, 2 failed, 0 blocked

## Run environment

- Workflow: [Uvin Auth and Accounts API checks](https://github.com/uvinN20/Finora-QA-Project/actions/runs/46024265645)
- Branch: `qa/uvin-plan-traceability-auth-accounts`
- Tested commit: `f5ebad17dae7301bba6e39a621c586bab426556a`
- Runtime: GitHub-hosted Ubuntu runner with Node.js 20.20.2
- Database: disposable MongoDB `mongo:7` service for the workflow job
- Results artifact: `uvin-auth-accounts-api-results`

The workflow run and artifact contain no passwords or bearer tokens. The job used isolated test data; it did not use the local MongoDB database.

## Case results

| Case | Expected | Actual | Result |
|---|---|---|---|
| TC-AUTH-01 | Register returns 201; safe user, token, and one default Cash account | 201; all checks passed | Pass |
| TC-AUTH-02 | Each missing required field returns 400 | 400, 400, 400 | Pass |
| TC-AUTH-03 | Duplicate email returns 400 | 400 | Pass |
| TC-AUTH-04 | Malformed email is rejected with 4xx and no records created | 201; malformed address accepted | Fail |
| TC-AUTH-05 | Five-character password is rejected with 4xx and no records created | 500 | Fail |
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

## Defects recorded

1. [Issue #2: Registration accepts malformed email](https://github.com/uvinN20/Finora-QA-Project/issues/2) — TC-AUTH-04 returned HTTP 201 instead of a 4xx rejection.
2. [Issue #3: Short registration password returns server error](https://github.com/uvinN20/Finora-QA-Project/issues/3) — TC-AUTH-05 returned HTTP 500 instead of a 4xx validation response.

## Manual execution status (user-reported)

On 2026-11-27, Uvin reported manually executing all 17 cases and observing **Pass** for each. The manual CSV now records `Pass` for all 17, with the evidence reference `Manual execution reported by Uvin on 2026-11-27; details not attached`.

Per-case response codes, screenshots, tested build/commit, and execution environment were not supplied, so this records Uvin's report and does not independently verify the manual run.

These user-reported manual results differ from the automated run above: TC-AUTH-04 returned 201 and TC-AUTH-05 returned 500 in GitHub Actions. Issues #2 and #3 remain open until the application fixes are present on the QA branch and a rerun confirms the expected 4xx responses.

The workflow runs on pushes to this QA branch that change `backend/**` or the API runner, and can also be started with `workflow_dispatch`.
