# Black-Box Test Design

## Purpose and basis

This design defines input and behaviour partitions for Finora without depending on the internal controller implementation. The API routes, models, and README in the repository are the current source for expected behaviour. Manual test execution is tracked separately; the case status starts as `Not Run`.

## Techniques

1. **Equivalence partitioning** groups inputs expected to behave alike, such as valid versus missing registration fields, valid versus invalid credentials, and owned versus foreign accounts.
2. **Boundary-value analysis** checks the password minimum (5, 6, and 7 characters) and account balances at zero, positive, and negative values.
3. **Decision tables** cover combinations of authentication token and ownership for protected account operations.
4. **State-transition testing** checks account creation, update, deletion, and the blocked delete state when transactions exist.
5. **Error guessing** targets malformed email, duplicate email, invalid JWT, foreign IDs, and attempts to expose or change protected fields.

## Authentication partitions

| Input or condition | Valid partition | Invalid/negative partitions | Expected behaviour |
|---|---|---|---|
| Registration fields | Name, email, password all present | Each required field omitted | Valid registration returns 201; missing required data returns 400. |
| Email | Unique syntactically valid email | Malformed email; duplicate email, including case variation | Malformed and duplicate addresses should be rejected without creating a user. |
| Password length | Six characters or more | Five characters or fewer | Below-minimum password is rejected; six-character boundary is accepted. |
| Login credentials | Existing email and matching password | Missing field, wrong password, unknown email | Missing data returns 400; invalid credentials return 401 with a generic message. |
| Protected API | Valid bearer token | Missing, malformed, expired, or invalid token | Valid token reaches the operation; invalid token returns 401 and no protected data. |

## Accounts partitions

| Operation | Valid partition | Invalid/negative partitions | Expected behaviour |
|---|---|---|---|
| List accounts | Authenticated owner with zero or more accounts | Missing/invalid token; account belonging to another user | Return only the authenticated user's accounts and a total equal to their balances. |
| Create account | Non-empty name; supported account type; non-negative balance | Missing name, unsupported type, negative balance | Valid input creates an owner-bound account with HTTP 201; invalid input should be rejected without creating a record. |
| Update account | Existing account owned by the caller; allowed name/type fields | Foreign account ID, nonexistent ID, malformed ID | Update only the selected owner's account; foreign/nonexistent IDs return 404. |
| Delete account | Owned account with no transactions | Foreign/nonexistent ID; account with one or more transactions | Empty account can be deleted; foreign/nonexistent ID returns 404; referenced account is not deleted and returns 400. |

## State and data invariants

- A successful registration creates one user and the documented default Cash account; response data must not expose the password or password hash.
- Failed registration must not leave a user or default account behind.
- Account list results must be user-scoped; the `total` is the sum of only those returned accounts.
- Updating an account must not silently alter its balance when balance is not an editable field.
- A failed update or deletion must leave the stored account unchanged.

## Risk-based observations from source review

The current source has a Mongoose minimum password length and required fields, but no email-format validator. It also has no non-negative account balance validator. These are validation targets, not assumed passing behaviour. Record observed results and raise defects if requirements are not met. The generic error handler may return 500 for model-validation errors; client-input failures should normally be represented by 4xx responses.

## Case inventory

The assigned Authentication and Accounts cases are listed in `manual-test-cases-auth-accounts.csv`. The full group RTM lists the planned IDs for the other modules so their owners can add their detailed cases without duplicating IDs.

