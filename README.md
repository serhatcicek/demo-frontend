# demo-frontend

Contract-first frontend demo.

## Run

```text
node server.js
```

Frontend starts on `http://localhost:4173`.

## UI scope

- Checkout page
- Payment status component
- Retry failed payment button

## Contract source

The frontend reads the shared contract from the `ai-contracts` submodule:

- `ai-contracts/contracts/api/payments.md`

## Suggested prompt

```text
Read ai-contracts/contracts/api/payments.md.
Create the frontend payment client and checkout UI based only on this contract.
Do not invent endpoints.
```
