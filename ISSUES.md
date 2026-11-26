# ShiftSync — Issue Backlog

One issue per day, in priority order. Copy each section into a new GitHub issue:
the **heading** is the issue title, everything under it is the issue body.

| Day | Issue | Priority | Area |
|-----|-------|----------|------|
| 1 | Add authentication and per-user ownership to study sessions API | 🔴 Critical | backend, security |
| 2 | Remove hardcoded dev JWT key risk from Docker setup | 🔴 Critical | backend, security, devops |
| 3 | Re-check user role on every request, not only status | 🟠 High | backend, security |
| 4 | Stop leaking account status on login and add rate limiting | 🟠 High | backend, security |
| 5 | Make CI actually run tests and fail on errors | 🟠 High | ci |
| 6 | Make Azure deployment usable (bootstrap admin, persistent data, email config) | 🔴 Critical | devops |
| 7 | Only deploy to Azure after CI passes | 🟠 High | ci, devops |
| 8 | Fix wrong date range in Schedule week/month view | 🟠 High | frontend, bug |
| 9 | Refresh Schedule after creating items and wire up the Edit button | 🟠 High | frontend, bug |
| 10 | Connect workplaces to the backend API instead of localStorage | 🔴 Critical | frontend |
| 11 | Connect shifts (incl. clock-in/out) to the backend API | 🔴 Critical | frontend |
| 12 | Connect study sessions to the backend API | 🔴 Critical | frontend |
| 13 | Connect notices to the backend API | 🔴 Critical | frontend |
| 14 | Admin dashboard and user management should use backend data | 🟠 High | frontend |
| 15 | Clear all user data from localStorage on logout | 🟠 High | frontend, security |
| 16 | Fix notice creation, validation and pagination bugs | 🟡 Medium | backend, bug |
| 17 | Prevent clock-in from overwriting a completed shift | 🟡 Medium | backend, bug |
| 18 | Handle shifts and notices when a workplace is deleted | 🟡 Medium | backend |
| 19 | Make Gmail/Outlook sync robust | 🟡 Medium | backend, email |
| 20 | Persist shifts, workplaces, notices, study sessions and email accounts | 🟡 Medium | backend |
| 21 | Return 400 instead of 500 for duplicate email registration | 🟡 Medium | backend, bug |
| 22 | Unify the two axios clients and handle 401/403 consistently | 🟡 Medium | frontend |
| 23 | Fix invalid tsconfig and package.json problems | 🟢 Low | frontend, tooling |
| 24 | Remove debug console.log calls and dead code | 🟢 Low | cleanup |
| 25 | Remove files that should not be tracked in git | 🟢 Low | cleanup |
| 26 | Sanitize rich-text HTML in the Notepad | 🟢 Low | frontend, security |
| 27 | Enable JWT issuer and audience validation | 🟢 Low | backend, security |

---

## Day 1 — Add authentication and per-user ownership to study sessions API

**Labels:** `bug` `security` `backend` · **Priority:** 🔴 Critical

### Problem
`StudySessionsController` has no `[Authorize]` attribute and no owner field. Anyone on the internet, without logging in, can list, edit or delete every user's study sessions.

**File:** `backend/Controllers/StudySessionsController.cs`

### Steps to reproduce
1. Start the backend.
2. `curl http://localhost:3001/api/study-sessions` without a token.
3. The request succeeds and returns all sessions.

### Fix
- Add `[Authorize]` to the controller.
- Add `UserId` to `StudySessionDto`. Set it from the JWT on create, and never accept it from the request body.
- Filter `GET` by the current user. Return 403 (or 404) on get/update/delete/complete when the session belongs to someone else.

### Acceptance criteria
- [ ] Requests without a token return 401.
- [ ] User A cannot read, update or delete user B's sessions.
- [ ] Unit tests cover the ownership checks.

---

## Day 2 — Remove hardcoded dev JWT key risk from Docker setup

**Labels:** `security` `backend` `devops` · **Priority:** 🔴 Critical

### Problem
`docker-compose.yml` sets `ASPNETCORE_ENVIRONMENT` to `Development` by default. In Development, `Program.cs` falls back to a JWT signing key that is written in the source code. The backend port (3001) is exposed, so anyone who has read the repo can sign a token such as `{ id: 1, role: "admin" }` and get admin access.

**Files:** `docker-compose.yml`, `backend/Program.cs`

### Fix
- Default `ASPNETCORE_ENVIRONMENT` to `Production` in `docker-compose.yml`.
- Pass `JWT_KEY` through compose from `.env` and require it (`${JWT_KEY:?JWT_KEY is required}`).
- Optionally, generate a random key at startup in Development instead of using a constant.
- Add a `.env.example` file that documents the required variables.

### Acceptance criteria
- [ ] `docker compose up` without `JWT_KEY` fails with a clear error.
- [ ] No signing key is hardcoded in the source.

---

## Day 3 — Re-check user role on every request, not only status

**Labels:** `security` `backend` · **Priority:** 🟠 High

### Problem
The middleware in `Program.cs` reloads the user on each request but only checks `Status`. The role comes from the JWT, which is valid for 8 hours. An admin who is demoted to agent keeps full admin rights until their token expires.

**File:** `backend/Program.cs` (custom middleware)

### Fix
In the middleware, compare the database role with the `role` claim. If they differ, return 401 so the client logs in again. Alternatively, rebuild `context.User` with the current role from the database.

### Acceptance criteria
- [ ] After an admin is demoted, their next request to an admin-only endpoint is rejected.
- [ ] A test covers this.

---

## Day 4 — Stop leaking account status on login and add rate limiting

**Labels:** `security` `backend` · **Priority:** 🟠 High

### Problem
`UserService.LoginAsync` returns "This account is not active." **before** verifying the password. An attacker can use this to find which emails belong to invited or deactivated accounts. There is also no rate limiting on `/api/auth/login`, so passwords can be brute-forced.

**File:** `backend/Services/UserService.cs` (`LoginAsync`)

### Fix
- Verify the password first. Only reveal the "not active" message when the password is correct.
- Add ASP.NET Core rate limiting (`AddRateLimiter`) to the login, accept-invitation and bootstrap-admin endpoints.
- Handle a `null` email/password without throwing a NullReferenceException (currently a 500).

### Acceptance criteria
- [ ] A wrong password on an inactive account returns the same message as for an unknown email.
- [ ] Too many login attempts return 429.

---

## Day 5 — Make CI actually run tests and fail on errors

**Labels:** `ci` · **Priority:** 🟠 High

### Problem
In `.github/workflows/ci.yml`:
- The backend test step is `echo "No backend tests configured"`, even though `backend.Tests` has 48 passing tests.
- The frontend test step ends with `|| echo "No tests configured"`, so failures never fail the build.
- `CI: false` hides lint warnings.
- Node 18 is end-of-life.

### Fix
- Replace the backend step with `dotnet test backend.Tests/backend.Tests.csproj --configuration Release`.
- Remove the `2>/dev/null || echo ...` from the frontend test step.
- Update the Node matrix to `20.x` and `22.x`.
- Update `actions/setup-dotnet` to v4.

### Acceptance criteria
- [ ] A failing backend or frontend test makes CI red.

---

## Day 6 — Make Azure deployment usable (bootstrap admin, persistent data, email config)

**Labels:** `devops` · **Priority:** 🔴 Critical

### Problem
`deploy/azure-deploy.sh` deploys an app that nobody can log into, and it loses all data on every deploy:
- `Bootstrap__AdminToken` is never set, and self-registration is off in Production, so the first account can't be created.
- SQLite is stored at `/app/data` inside the container with no persistent storage, so every deploy wipes all users.
- The `InvitationEmail__*` settings are not configured, so invites fail.
- `Email__CallbackBaseUrl` / `Email__FrontendReturnUrl` are not set, so email OAuth fails.

**File:** `deploy/azure-deploy.sh`

### Fix
- Set `ConnectionStrings__Users=Data Source=/home/data/shiftsync-users.db` and `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`, or move to a managed database.
- Pass `Bootstrap__AdminToken`, the SMTP settings and the email OAuth settings from GitHub secrets.
- Document the required secrets in the README.

### Acceptance criteria
- [ ] After a fresh deploy, an admin can be bootstrapped and can log in.
- [ ] Users still exist after a redeploy.

---

## Day 7 — Only deploy to Azure after CI passes

**Labels:** `ci` `devops` · **Priority:** 🟠 High

### Problem
`azure-deploy.yml` runs on every push to `main`, independently of CI. Broken code gets deployed. Images are always tagged `:latest`, so there is no way to roll back.

### Fix
- Trigger the deploy with `workflow_run` on successful completion of CI, or merge both into one workflow with `needs: build`.
- Tag images with the commit SHA (keep `latest` as an extra tag if you like).
- Replace `azure/login@v1` with `@v2`.

### Acceptance criteria
- [ ] A commit with failing tests is not deployed.
- [ ] Each deployed image can be traced back to a commit.

---

## Day 8 — Fix wrong date range in Schedule week/month view

**Labels:** `bug` `frontend` · **Priority:** 🟠 High

### Problem
`getDateRange()` in `frontend/src/pages/Schedule/Schedule.tsx` has three bugs:
1. `end.setDate(start.getDate() + 6)` uses `end`'s month, not `start`'s. Example: for **Wed 1 Apr 2026**, start = 30 Mar, and end becomes "April 36" = **6 May**.
2. On **Sunday** (`getDay() === 0`), `- dayOfWeek + 1` jumps to the next Monday, so the wrong week is shown.
3. `toISOString().split('T')[0]` converts to UTC, so in time zones ahead of UTC the date can be off by one day near midnight.

`getViewTitle()` and `WeekView` / `MonthView` have the same Sunday problem.

### Fix
- Write one helper, `getWeekStart(date)` (Monday-based: `(day + 6) % 7`), and compute `end` from `start`.
- Format dates with local getters (or `date-fns` `format(d, 'yyyy-MM-dd')`, which is already a dependency).
- Add unit tests for Sunday, a week that crosses months, and a week that crosses years.

### Acceptance criteria
- [ ] The week view always shows exactly Monday to Sunday of the selected week.
- [ ] Tests pass for the edge cases above.

---

## Day 9 — Refresh Schedule after creating items and wire up the Edit button

**Labels:** `bug` `frontend` · **Priority:** 🟠 High

### Problem
- `ShiftForm` and `StudyForm` each call `useShifts()` / `useStudySessions()` themselves, which creates separate state. After saving, the Schedule page doesn't show the new item until the user changes the date.
- The "Edit Shift / Edit Session" button in `EventDetails` (`Schedule.tsx`) has no `onClick`, so it does nothing.

### Fix
- Pass `createShift` / `createStudySession` from the page into the forms (or call `fetchShifts()` in `onSuccess`). Longer term, use a shared store or React Query.
- Implement editing: open the form pre-filled and call `updateShift` / `updateStudySession`.

### Acceptance criteria
- [ ] A newly created shift or session appears immediately.
- [ ] The Edit button opens an edit form and saves changes.

---

## Day 10 — Connect workplaces to the backend API instead of localStorage

**Labels:** `frontend` `enhancement` · **Priority:** 🔴 Critical

### Problem
`frontend/src/hooks/useWorkplaces.ts` (and `WorkplaceForm.tsx`) save workplaces in `localStorage` and fake API delays with `setTimeout`. The real `workplaceService.ts` exists but is never used, so workplaces are not shared between users and are lost when the browser is cleared.

### Fix
- Rewrite `useWorkplaces` to use `workplaceService` (`GET/POST/PUT/DELETE /api/workplaces`).
- Remove the `localStorage` reads and writes in `WorkplaceForm.tsx`.
- Show API errors to the user.

### Acceptance criteria
- [ ] A workplace created by an admin is visible to assigned agents in another browser.
- [ ] No `shiftsync_workplaces` key is used anymore.

*Do this first, because shifts depend on workplace IDs from the backend.*

---

## Day 11 — Connect shifts (incl. clock-in/out) to the backend API

**Labels:** `frontend` `enhancement` · **Priority:** 🔴 Critical

### Problem
`frontend/src/hooks/useShifts.ts` stores shifts in `localStorage`, hardcodes `userId: 1`, and uses `Date.now()` as the ID. `shiftService.ts` is never used. Clock-in/out state is also kept only in `localStorage` (`shiftsync_active_clockin`).

### Fix
- Use `shiftService` for list, create, update, delete, confirm, clock-in and clock-out. Pass `startDate`/`endDate` as query parameters.
- Work out the active clock-in from the server data (`actualStartTime && !actualEndTime`) instead of `localStorage`.
- Update `ShiftReminderNotifications` to use the API data.

### Acceptance criteria
- [ ] Shifts persist across browsers and devices.
- [ ] Each shift's `userId` is the logged-in user (set by the server).
- [ ] No `shiftsync_shifts` / `shiftsync_active_clockin` keys are used.

---

## Day 12 — Connect study sessions to the backend API

**Labels:** `frontend` `enhancement` · **Priority:** 🔴 Critical

### Problem
`frontend/src/hooks/useStudySessions.ts` uses `localStorage` (`shiftsync_study_sessions`) instead of `studyService.ts`.

### Fix
Use `studyService` for all CRUD and "mark complete". Depends on **Day 1** (backend auth and ownership).

### Acceptance criteria
- [ ] Study sessions persist on the server and are visible only to their owner.

---

## Day 13 — Connect notices to the backend API

**Labels:** `frontend` `enhancement` · **Priority:** 🔴 Critical

### Problem
`frontend/src/hooks/useNotices.ts` keeps notices only in `localStorage`, so agents never see notices posted by admins. The file also contains about 15 debug `console.log` calls.

### Fix
- Add a `noticeService.ts` that calls `/api/notices/workplace/{id}`, `/api/notices/{id}`, and so on.
- Rewrite `useNotices` to use it, and remove the logging.

### Acceptance criteria
- [ ] A notice created by an admin is visible to agents assigned to that workplace.

---

## Day 14 — Admin dashboard and user management should use backend data

**Labels:** `frontend` · **Priority:** 🟠 High

### Problem
- `AdminDashboard.tsx` reads shifts from `localStorage`, and its team list comes from `teamService` (also `localStorage`). Stats such as "working now", "upcoming" and "unconfirmed" only reflect the admin's own browser.
- `UserManagement.tsx` reads workplaces from `localStorage`, so `assignedWorkplaceIds` sent to the backend don't match real workplace IDs.

### Fix
- Load team members with `usersService.getAll()`, and shifts with `shiftService` (admins already get all shifts).
- Load workplaces from `workplaceService`.
- Delete `teamService.ts` if nothing else needs it.

### Acceptance criteria
- [ ] The admin dashboard numbers match the server data.
- [ ] Workplace assignment uses backend workplace IDs.

---

## Day 15 — Clear all user data from localStorage on logout

**Labels:** `security` `frontend` · **Priority:** 🟠 High

### Problem
`authService.logout()` only removes `shiftsync_token` and `shiftsync_user`. Notes, the activity log, notices and other cached data stay behind, so the next person on a shared computer can see them.

### Fix
On logout, remove every `shiftsync_*` key except UI preferences such as `shiftsync_theme`. Alternatively, namespace keys by user ID.

### Acceptance criteria
- [ ] After logout and login as a different user, none of the previous user's data is visible.

---

## Day 16 — Fix notice creation, validation and pagination bugs

**Labels:** `bug` `backend` · **Priority:** 🟡 Medium

### Problem
In `backend/Services/NoticeService.cs` and `NoticesController.cs`:
- `CreatedByUserId = 1` and `CreatedByUserName = "User"` are hardcoded.
- Creating a notice doesn't check that the workplace exists.
- `UpdateAsync` skips the 200/5000-character limits.
- `pageSize=0` divides by zero, and negative `page` values are accepted.
- `Update` doesn't catch `ArgumentException`.

### Fix
- Pass the current user's ID and name from the controller.
- Validate that the workplace exists, validate on update, and clamp `page >= 1` and `1 <= pageSize <= 100`.

### Acceptance criteria
- [ ] Notices show the real author.
- [ ] Invalid input returns 400, never 500.

---

## Day 17 — Prevent clock-in from overwriting a completed shift

**Labels:** `bug` `backend` · **Priority:** 🟡 Medium

### Problem
`ShiftService.ClockInAsync` allows clocking in again after clocking out. It overwrites `ActualStartTime` and resets `ActualEndTime = null`, which erases the recorded times. Agents can also confirm their own shifts; check whether that is intended.

**File:** `backend/Services/ShiftService.cs`

### Fix
- Throw `InvalidOperationException("Shift already completed")` when `ActualEndTime` is set.
- Decide whether `Confirm` should be admin-only, and enforce that in `ShiftsController`.

### Acceptance criteria
- [ ] Recorded times can't be overwritten by clocking in again.
- [ ] Tests cover this.

---

## Day 18 — Handle shifts and notices when a workplace is deleted

**Labels:** `backend` · **Priority:** 🟡 Medium

### Problem
Deleting a workplace leaves its shifts and notices behind. Each shift also stores a copy of the `Workplace` object, so pay rate or colour changes are never reflected in existing shifts.

### Fix
- Choose a rule: block deletion while shifts exist, cascade-delete them, or soft-delete (archive).
- Stop storing a copy of the workplace on each shift. Look it up by `WorkplaceId` when returning shifts.

### Acceptance criteria
- [ ] No orphaned shifts or notices.
- [ ] Shifts always show the current workplace details.

---

## Day 19 — Make Gmail/Outlook sync robust

**Labels:** `backend` `email` · **Priority:** 🟡 Medium

### Problem
In `backend/Services/EmailService.cs`:
- `root.GetProperty("payload")` throws `KeyNotFoundException`, which isn't caught, so the response is a 500.
- 20 Gmail messages are fetched one by one in sequence (N+1 requests).
- `DateTime.TryParse` often fails on RFC 2822 `Date` headers and silently falls back to "now".
- Message dates from Gmail could use `internalDate` instead.

### Fix
- Use `TryGetProperty`, and catch `JsonException` / `KeyNotFoundException` in the controller.
- Fetch message details in parallel with a limit (e.g. `Parallel.ForEachAsync`, max 5).
- Use the Gmail `internalDate` field (milliseconds since epoch) for the date.

### Acceptance criteria
- [ ] A malformed message is skipped instead of failing the whole sync.
- [ ] Dates are correct.

---

## Day 20 — Persist shifts, workplaces, notices, study sessions and email accounts

**Labels:** `backend` `enhancement` · **Priority:** 🟡 Medium

### Problem
Only users are stored in SQLite. Everything else uses `InMemory*Repository`, so all of it is lost on restart, including OAuth refresh tokens.

### Fix
- Add SQLite (or EF Core) repositories for each entity, following the pattern of `SqliteUserRepository`.
- Encrypt OAuth tokens at rest, e.g. with ASP.NET Data Protection.
- Update `backend/PERSISTENCE.md`.

### Acceptance criteria
- [ ] All data survives a backend restart.

---

## Day 21 — Return 400 instead of 500 for duplicate email registration

**Labels:** `bug` `backend` · **Priority:** 🟡 Medium

### Problem
`RegisterAsync` and `InviteAsync` check for an existing email, then insert. If two requests arrive at the same moment, the second hits the SQLite `UNIQUE` constraint and throws `SqliteException`, which isn't caught, so it returns 500.

### Fix
In the repository, catch `SqliteException` with `SqliteErrorCode == 19` (constraint violation) and rethrow it as `ArgumentException("An account with this email already exists.")`.

### Acceptance criteria
- [ ] Duplicate emails always return 400.

---

## Day 22 — Unify the two axios clients and handle 401/403 consistently

**Labels:** `frontend` · **Priority:** 🟡 Medium

### Problem
`services/api.ts` and `services/authService.ts` each create their own axios instance with different interceptors:
- On 401, `api.ts` removes the token but leaves `shiftsync_user`, and it redirects even when already on `/login`.
- The 403 the backend returns for deactivated users is not handled anywhere.

### Fix
- Use one shared axios instance.
- On 401, or on 403 for an inactive account, call `logout()` and redirect once.

### Acceptance criteria
- [ ] A deactivated user is logged out on their next request.
- [ ] No redirect loops.

---

## Day 23 — Fix invalid tsconfig and package.json problems

**Labels:** `frontend` `tooling` · **Priority:** 🟢 Low

### Problem
- `frontend/tsconfig.json` sets `"moduleResolution": "bundler"`, which TypeScript 4.9 doesn't support, so `npx tsc --noEmit` fails.
- `package.json` has a self-dependency `"frontend": "file:"`.
- Testing libraries and `@types/*` are in `dependencies` instead of `devDependencies`.

### Fix
- Change to `"moduleResolution": "node"`.
- Remove `"frontend": "file:"`.
- Move the test and type packages to `devDependencies`.
- Add a `"typecheck": "tsc --noEmit"` script and run it in CI.

### Acceptance criteria
- [ ] `npm run typecheck` passes.

---

## Day 24 — Remove debug console.log calls and dead code

**Labels:** `cleanup` · **Priority:** 🟢 Low

### Problem
- Debug logging in `ShiftForm.tsx`, `useNotices.ts`, `Schedule.tsx` and `Workplaces.tsx` (some of it logs full form data).
- Unused methods: `ValidateShift`, `ValidateWorkplace`, `ValidateCreateRequest`, `ValidateStudySession` and `GetExclusiveEndDate` in the controllers (their logic now lives in the services).
- `ShiftService` has two identical `ValidateShift` overloads.

### Fix
- Delete the logs, or put them behind a dev-only logger.
- Remove the unused methods and merge the duplicate validation.
- Add the ESLint rule `no-console: warn`.

### Acceptance criteria
- [ ] No `console.log` in `src/` (tests excluded).
- [ ] No unused private methods in the controllers.

---

## Day 25 — Remove files that should not be tracked in git

**Labels:** `cleanup` · **Priority:** 🟢 Low

### Problem
`SQLQuery1.sql` (MySQL user setup with a placeholder password) and `.vscode/settings.json` (local DB connection) are committed even though `.gitignore` excludes them. They refer to MySQL, but the app uses SQLite.

### Fix
```bash
git rm --cached SQLQuery1.sql .vscode/settings.json
```
If a real password was ever used in these files, change it.

### Acceptance criteria
- [ ] Neither file is tracked anymore.

---

## Day 26 — Sanitize rich-text HTML in the Notepad

**Labels:** `security` `frontend` · **Priority:** 🟢 Low

### Problem
`NotepadModal.tsx` renders stored note HTML with `dangerouslySetInnerHTML` and no sanitizing. Today it's only the user's own data, but it becomes an XSS risk as soon as notes are synced or shared.

### Fix
Add `dompurify` and render `DOMPurify.sanitize(selectedNote.text)`.

### Acceptance criteria
- [ ] A note containing `<img src=x onerror=alert(1)>` doesn't run any script.

---

## Day 27 — Enable JWT issuer and audience validation

**Labels:** `security` `backend` · **Priority:** 🟢 Low

### Problem
`Program.cs` sets `ValidateIssuer = false` and `ValidateAudience = false`. Tokens signed with the same key for another purpose or service would be accepted.

### Fix
- Add `Jwt:Issuer` and `Jwt:Audience` config values.
- Set them when creating tokens in `UserService.CreateToken`, and validate both in `Program.cs`.
- Keep `ClockSkew` small (e.g. 1 minute).

### Acceptance criteria
- [ ] A token with a wrong issuer or audience is rejected.
