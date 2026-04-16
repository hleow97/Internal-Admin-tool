# Expense Admin Tool

An internal admin tool for managing expense categories and expense codes. Built with Django REST Framework (backend) and Next.js (frontend).

## Screenshots

**Active categories with codes:**

![Active categories](assets/Screenshot%202026-04-16%20at%2012.05.04%E2%80%AFPM.png)

**Active categories with inactive codes filter:**

![Inactive codes](assets/Screenshot%202026-04-16%20at%2012.05.15%E2%80%AFPM.png)

**Edit category modal:**

![Edit category](assets/Screenshot%202026-04-16%20at%2012.48.34%E2%80%AFPM.png)

**Inactive categories view:**

![Inactive categories](assets/Screenshot%202026-04-16%20at%2012.04.58%E2%80%AFPM.png)

---

## Progress Summary

**Completed:** Shipped expense admin tool (full stack) to GitHub; built Django REST API with CRUD, optimistic locking, and pagination; built Next.js frontend with side-by-side table layout, modal forms, and active/inactive filtering; resolved filter-page-reset bug and inactive category code sync issue; wrote 10 backend + 27 frontend tests.

**Ongoing:** Finalising README documentation with trade-offs and production improvement roadmap (auth, concurrency, scaling, branching strategy).

**Blockers/Updates:** No blockers. Repo pushed to github.com/hleow97/Internal-Admin-tool — ready for review.

**Plan for Tomorrow:** Awaiting feedback on the current implementation; can start on search/sorting functionality, authentication layer, or UI refinements based on team priorities.

---

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Backend  | Python 3, Django 5.1, Django REST Framework   |
| Database | SQLite                                        |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind v4 |
| Testing  | pytest (backend), Jest + React Testing Library (frontend) |

---

## Getting Started

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data   # load sample data
python manage.py runserver   # http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

---

## Trade-offs Due to Time Constraints

### SQLite Instead of PostgreSQL
SQLite was chosen for zero-configuration setup. In production, this limits concurrent write throughput, has no built-in full-text search, and lacks advanced indexing (trigram, GIN). A single-writer lock is acceptable for a solo-developer demo but not for multi-user production use.

### Active/Inactive Separated by Filter Instead of Shown Together
Inactive categories and codes are hidden behind a dropdown filter rather than displayed alongside active items with visual distinction. This keeps the default view clean and focused — admins primarily work with active records, and mixing statuses in one list adds visual noise and increases the chance of accidental edits to inactive items. The trade-off is discoverability: new users may not realize inactive items exist until they switch the filter. A production version could show a count badge (e.g., "3 inactive") next to the filter to surface this.

### Soft Delete Only (No Hard Delete)
The API has no `DELETE` endpoints. Deactivation (`is_active: false` via `PUT`) is the only way to remove items. This was chosen because it's safer to ship without hard delete than to ship hard delete without proper safeguards — accidental permanent deletion in an admin tool can break downstream references in reports, transactions, or audit trails, and there's no undo.

In production, both soft and hard delete would coexist:
- **Soft delete** remains the default action for day-to-day admin use — deactivate, recover if needed
- **Hard delete** added for data cleanup, GDPR/privacy compliance ("right to be forgotten"), and removing test data — restricted to admin role only, blocked if the record has dependencies (e.g., category with codes), requires explicit confirmation, and is logged in the audit trail before the record is removed

### No Search or Sorting
Category and code lists are paginated but not searchable or sortable. Users must page through results to find what they need. For a production tool with hundreds or thousands of records, this would be a significant usability gap.

### Offset Pagination Instead of Cursor
Offset pagination (`?page=2&page_size=6`) is simple and supports direct page jumping, which is natural for admin UIs. However, performance degrades at high page numbers (`OFFSET 10000` still scans skipped rows) and results can shift when records are inserted or deleted between page loads.

### Refetch After Mutation Instead of Optimistic Updates
After creating or updating a record, the frontend re-fetches the entire list from the API. This is simple and always consistent, but adds a round-trip. For an internal tool with low latency, this is acceptable. For a public-facing or high-latency app, optimistic updates would feel snappier.

### No Bulk Operations
There's no way to bulk deactivate categories, bulk import codes, or perform batch updates. Each mutation is a single API call. This is fine for occasional admin tasks but would be painful for large-scale data management.

### Minimal Error Recovery
Network errors show a dismissible alert. There's no retry logic, no offline queue, and no automatic recovery. If a request fails, the user must manually retry.

---

---

## Production Improvements

### Authentication & Permissions

**Approach:** Token-based authentication using `djangorestframework-simplejwt` for stateless JWT auth.

**Why JWT over session auth:** The frontend is a separate Next.js app making cross-origin API calls. JWTs work naturally with this architecture — no cookie/CSRF complexity, tokens are sent via `Authorization` header, and they're stateless (no server-side session store).

**Permission model:**
- **Viewer** — read-only access to categories and codes (`GET` endpoints)
- **Editor** — full CRUD on categories and codes (`GET`, `POST`, `PUT`)
- **Admin** — editor permissions plus user management

**Implementation:**
- Backend: DRF `permission_classes` on each view (e.g., `IsAuthenticated`, custom `IsEditorOrReadOnly`)
- Frontend: auth context provider, login page, token storage in httpOnly cookies (not localStorage — XSS risk), automatic token refresh via interceptor, redirect to login on 401

**What changes:**
- Add `djangorestframework-simplejwt` to requirements
- Create a `users` app with login/register/refresh endpoints
- Add `DEFAULT_PERMISSION_CLASSES` and `DEFAULT_AUTHENTICATION_CLASSES` to DRF settings
- Frontend: wrap app in auth provider, add login page, attach token to all API requests

---

### Concurrency & Conflicting Updates

**What's already implemented:** Optimistic locking via an `updated_at` timestamp check. On update, the backend atomically filters by `pk` AND `updated_at` in a single query:

```python
rows = Model.objects.filter(pk=id, updated_at=expected_timestamp).update(**data)
if rows == 0:
    raise ConflictError()  # 409
```

This prevents lost updates — if two users edit the same record, the second save gets a 409 and must refresh.

**What would improve for production:**

1. **PostgreSQL row-level locking** — `SELECT ... FOR UPDATE` for critical operations, providing stronger guarantees than the application-level timestamp check.

2. **Retry UX on conflict** — Instead of just showing "modified by another user", offer a diff view: show the user what changed since their last read and let them merge or overwrite..


---

### Scaling to Thousands of Categories and Codes

**Database:**
- Migrate to PostgreSQL for concurrent writes, full-text search, and advanced indexing
- Add indexes on frequently filtered/sorted columns: `name`, `code`, `is_active`, `category_id`
- Add trigram indexes (`pg_trgm`) for fast partial-match search (`LIKE '%travel%'`)

**Pagination:**
- Switch to cursor-based pagination for stable performance regardless of depth. Cursor pagination uses a keyset (`WHERE id > last_seen_id ORDER BY id LIMIT N`) instead of `OFFSET`, so page 1000 is as fast as page 1.
- Trade-off: cursor pagination doesn't support "jump to page 5" — it's forward/backward only. For admin UIs this is usually acceptable with good search/filter.

**Caching:**
- Redis cache layer for read-heavy endpoints (category list rarely changes)
- Cache invalidation on write

**Frontend:**
- Debounced search to avoid flooding the API with requests on every keystroke
- Consider `react-query` or `SWR` for built-in caching, deduplication, and background refetching

---

### Search & Sorting

**Backend:**
- Add DRF's `SearchFilter` for keyword search across `name` (categories) and `code`/`description` (codes)
- Add `OrderingFilter` to allow sorting by any column (`?ordering=-name`, `?ordering=created_at`)
- Alternatively, use `django-filter` for field-specific filtering (`?name__icontains=travel&is_active=true`)

**Frontend:**
- Search input with debounce (300ms) — sends `?search=term` as a query parameter
- On search, reset to page 1 (same pattern as the existing active/inactive filter toggle)
- Sortable table headers — click to toggle ascending/descending
- Search works naturally with the paginated response: `count` reflects filtered results, so pagination adjusts automatically

---

### Branching & Release Strategy

Currently the project has a single `main` branch with no formal release process. At enterprise scale, a Gitflow model provides the structure needed for predictable releases and customer SLAs.

**Branch model:**
- `main` — production, tagged releases only (e.g., `v1.2.0`)
- `release/*` — stabilization branch for QA, security review, and compliance sign-off before shipping
- `develop` — integration branch, always ahead of `main`, where feature branches merge
- `feature/*` — short-lived branches off `develop`, merged via PR

**Environment mapping:**
- `develop` → staging (internal testing)
- `release/*` → UAT (customer-facing pre-production)
- `main` → production

**Why this matters for enterprise customers:**
- Parallel release tracks — stabilize `release/1.2.0` while `develop` keeps moving on 1.3 features
- Hotfix path — critical production bugs branch off `main`, fix, and merge back to both `main` and `develop`
- Audit trail — tagged releases on `main` map cleanly to changelogs, compliance docs, and support tickets
- Predictable schedules — enterprise customers expect staged rollouts, not continuous deployment

**Additional practices:**
- Semantic versioning (`MAJOR.MINOR.PATCH`) tied to tagged releases
- Protected branches with required PR reviews, passing CI, and security scans
- Automated changelog generation from PR titles between tags

---

### CI/CD Pipeline

Currently the project has no automated build, test, or deploy pipeline. For production, a CI/CD pipeline ensures every change is validated before it reaches users.

**Pipeline stages (GitHub Actions):**
1. **Lint & Type Check** — `ruff` / `mypy` (backend), `eslint` / `tsc` (frontend) on every PR
2. **Test** — `pytest` (backend) + `jest` (frontend) run in parallel; PR blocked if any test fails
3. **Build** — Docker image built and pushed to container registry (ECR / GCR)
4. **Deploy to Staging** — automatic on merge to `develop`; smoke tests run post-deploy
5. **Deploy to Production** — triggered by tagged release from `main`; canary or blue-green rollout

**Database migrations:** Run as a separate pre-deploy step (not at app startup) to avoid race conditions when multiple containers start simultaneously.

---

### Logging & Metrics

Currently the application relies on Django's default console logging with no structured output or metrics collection.

**Logging:**
- Structured JSON logs (not plain text) — every log entry includes timestamp, request ID, user ID, and action
- Centralized log aggregation via CloudWatch, Datadog, or ELK stack
- Correlation IDs across frontend → backend to trace a single user action through the system
- Audit log for all write operations — who changed what, when — stored immutably for compliance

**Metrics:**
- Request latency (p50, p95, p99) and error rates per endpoint
- Database query count and duration per request
- Business metrics: categories created/updated per day, active vs inactive ratio
- Dashboards with alerting thresholds (e.g., error rate > 1%, p99 latency > 2s)

**Health checks:**
- `/healthz` — shallow check for load balancer (app is running)
- `/readyz` — deep check for dependencies (database connected, migrations current)

