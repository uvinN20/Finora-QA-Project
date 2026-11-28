# Budget and Savings Goals Traceability

| Requirement ID | Requirement / behavior | Manual cases | Automated evidence |
|---|---|---|---|
| BUD-01 | Create/update monthly budgets and enforce month/year input boundaries | TC-BUD-01–04 | budgetController.test.js; financeApi.integration.test.js; Postman/manual API checks |
| BUD-02 | Calculate spending and apply 80% warning / 100% exceeded thresholds | TC-BUD-05–08 | budgetController.test.js; dashboardController.test.js |
| GOAL-01 | Create, update, contribute to, and delete savings goals with safe ownership | TC-GOAL-01–07 | goalController.test.js; financeApi.integration.test.js |
| SEC-02 | Restrict data access and mutation to the authenticated user | Cross-cutting: TC-GOAL-07 | Controller tests and two-user integration checks |
