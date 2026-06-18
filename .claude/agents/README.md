# Frontend Subagents — demo-frontend

This directory contains Claude Code project subagents for the Rent A Car frontend (`demo-frontend/`). Each agent has a specific role, a defined scope of files it may write, and a mandatory reading list drawn from the shared contracts in `../ai-contracts-demo/`.

---

## Agent index

| Agent file | Name | Use when |
|---|---|---|
| `frontend-developer.md` | Frontend Developer | Building or modifying EJS templates, routes, or static assets |
| `ui-ux-designer.md` | UI/UX Designer | Designing new pages or components, or reviewing layout consistency |
| `api-integration-agent.md` | API Integration Agent | Wiring API calls, mapping response fields, or auditing endpoint usage |
| `frontend-qa-tester.md` | Frontend QA Tester | Verifying a completed implementation against contracts and checklists |
| `accessibility-reviewer.md` | Accessibility Reviewer | Auditing pages for WCAG AA, semantic HTML, and keyboard navigation |

---

## When to use each agent

### frontend-developer
Invoke this agent when you need to **write or modify frontend source code**: EJS templates, route handlers, the API client service, public assets, or Tailwind configuration. This is the primary implementation agent.

Typical triggers:
- "Implement the vehicle listing page"
- "Add the reservation confirmation template"
- "Update the admin dashboard to show pending reservation count"

### ui-ux-designer
Invoke this agent **before** the Frontend Developer when a page or component does not yet have a design, or when you need a design review of an existing screen. This agent produces proposals and contract updates — it does not write source code.

Typical triggers:
- "Design the mobile layout for the vehicle detail page"
- "Propose a component spec for the reservation status badge"
- "Review the current home page for design token compliance"

### api-integration-agent
Invoke this agent when the task is specifically about **connecting frontend to the backend API**: implementing `apiClient.js` functions, mapping response fields to template variables, or auditing existing calls. Also use it when you are unsure whether a needed endpoint is documented.

Typical triggers:
- "Wire up the vehicle listing page to GET /api/v1/vehicles"
- "Handle 422 validation errors from the reservation POST endpoint"
- "Audit all API calls in src/services/ for openapi.yaml compliance"

### frontend-qa-tester
Invoke this agent **after** an implementation is complete to verify it before marking the work done. This agent runs through a systematic checklist covering routing, API compliance, SEO, SSR, forms, accessibility, responsiveness, and security.

Typical triggers:
- "QA the vehicle listing page implementation"
- "Run the QA checklist on the reservation form"
- "Check the admin login page for security and auth guard"

### accessibility-reviewer
Invoke this agent for a **deep accessibility audit** — either after implementation or as a dedicated pass before release. It covers WCAG AA contrast, semantic HTML, keyboard navigation, ARIA patterns, and form usability at a level of detail beyond the QA tester's checklist.

Typical triggers:
- "Run an accessibility audit on the vehicle detail page"
- "Check the reservation form for screen-reader compatibility"
- "Review all public pages for WCAG AA compliance before launch"

---

## Typical workflow

```
1. ui-ux-designer   → design proposal + contract updates
2. frontend-developer → implementation (reads design + API contracts)
3. api-integration-agent → wire API calls if complex or standalone
4. frontend-qa-tester → QA checklist + bug reports
5. accessibility-reviewer → accessibility audit + bug reports
6. frontend-developer → fix defects from QA and accessibility reports
```

Steps 3–5 can run in parallel once the implementation is complete.

---

## Shared rules for all agents

Every agent in this directory must:

1. Read `../ai-contracts-demo/README.md` before any work.
2. Read the agent-specific required-reading list in its own `.md` file.
3. Not edit `demo-backend/` source code.
4. Not call endpoints absent from `../ai-contracts-demo/api/openapi.yaml`.
5. Not invent API response fields.
6. Use only design tokens from `../ai-contracts-demo/design/design-system.md`.
7. If a required endpoint, field, or response shape is missing or insufficient: create `../ai-contracts-demo/change-requests/backend/BR-YYYYMMDD-short-description.md` and stop — do not continue frontend implementation.
8. List exact files to change before writing code; wait for user approval.
9. Write QA or verification output at the end of every implementation turn.

---

## Backend coordination via ai-contracts-demo

Frontend agents never edit backend code directly. When a required endpoint, field, response shape, or API behavior is missing from the contract, the frontend agent raises a formal backend change request and halts implementation.

### Backend Change Request process

```
Frontend agent identifies missing endpoint / field / response shape
          ↓
Creates ../ai-contracts-demo/change-requests/backend/BR-YYYYMMDD-short-description.md
(see that file's README for the required sections)
          ↓
Do NOT continue frontend implementation — stop and report the blocker
          ↓
Backend agent picks up the request and implements the change
          ↓
API Contract Owner updates openapi.yaml + endpoints.md
          ↓
Frontend agent re-reads the updated contract and resumes implementation
          ↓
Mark the BR file: Status: Resolved — {date}
```

### Trigger conditions (any one is enough to raise a BR)

- Required HTTP endpoint (method + path) absent from `openapi.yaml`
- Required response field absent from `openapi.yaml` or `models/*.md`
- Documented response shape does not match what the page needs
- Required query/path/body parameter is undocumented
- Error envelope or status codes differ from `error-format.md`

### The shared contract files that coordinate this handshake

| Contract file | Purpose |
|---|---|
| `../ai-contracts-demo/api/openapi.yaml` | Authoritative API spec — only endpoints listed here may be called |
| `../ai-contracts-demo/api/endpoints.md` | Human-readable endpoint summary |
| `../ai-contracts-demo/models/*.md` | Field-level detail for every entity |
| `../ai-contracts-demo/design/page-map.md` | Authoritative page and route registry |
| `../ai-contracts-demo/design/design-system.md` | Authoritative design token registry |
| `../ai-contracts-demo/change-requests/backend/` | Backend change requests raised by frontend agents |
