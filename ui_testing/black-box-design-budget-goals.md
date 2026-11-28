# Budget and Savings Goals — Black-Box Design Notes

## Budgets
- Month valid class: integer 1–12. Invalid: 0, 13, fractional, or non-numeric (TC-BUD-03).
- Amount valid class: finite number at least zero. Invalid: negative, string, non-finite, or missing (TC-BUD-04).
- For a LKR 1,000 budget, 79% (LKR 790) should be OK; 80% (LKR 800) and 99% (LKR 990) should be Warning; 100% (LKR 1,000) should be Exceeded. See TC-BUD-05–08 for threshold and category behavior.

## Savings Goals
Cases TC-GOAL-01–07 cover default current amount, required fields, positive target, progress and remaining calculations, updating values, contributions, and ownership protection.

Detailed inputs and expected results are in qa/manual-test-cases-budget-goals.csv. Statuses remain as supplied and are not claims of execution.
