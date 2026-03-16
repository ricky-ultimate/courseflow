# CourseFlow — Frontend Implementation Specification
**Version:** 2.0 — Authoritative  
**Audience:** Frontend Engineer  
**Backend Base URL:** `https://courseflow-backend-s16i.onrender.com/api/v1`

---

## 0. Foundational Principles

Before writing a single component, internalize these rules. Every decision below flows from them.

### 0.1 Role Hierarchy

| Role | Scope |
|------|-------|
| `ADMIN` | Full system access. Can see and mutate everything. |
| `HOD` | Read everything. Mutate only their own department's courses and schedules. Can lock/unlock their own department schedule. |
| `LECTURER` | Read-only on everything except self-service routes (`/users/me/*`). |
| `STUDENT` | Read schedules and exams. Submit and view own complaints. |

### 0.2 Token Persistence

On successful login or register, store `access_token` via `apiClient.setToken(token)`. This writes to `localStorage`. On every app load, the `ApiClient` constructor reads it back automatically. On logout, call `apiClient.setToken(null)` and redirect to `/login`.

### 0.3 Route Protection

Every route except `/login`, `/register`, `/forgot-password`, and `/reset-password` requires a valid token. If any request returns `statusCode: 401`, clear the token and redirect to `/login` with a toast: "Your session has expired. Please sign in again."

### 0.4 Universal Interaction Standards

These apply to every interactive element without exception:

- **Touch targets:** Every tappable or clickable element must be minimum **44×44px**. Icon-only buttons achieve this with padding, not by enlarging the icon itself.
- **Input font size:** All form inputs must render at minimum **16px font size** to prevent iOS Safari from auto-zooming the viewport on focus.
- **Tap delay:** Apply `touch-action: manipulation` to all buttons and links.
- **Safe area insets:** All sticky footers (modal footers, bottom navigation) must include `padding-bottom: env(safe-area-inset-bottom)` to avoid being obscured by the iOS home indicator.
- **Focus states:** All interactive elements must have a visible focus ring for keyboard navigation. Use `outline: 2px solid #4F46E5; outline-offset: 2px`.

### 0.5 Loading, Empty, and Error States

Every data-fetching action must have three states. Never show a blank page.

- **Loading:** Skeleton UI with animated pulse.
- **Populated:** The data.
- **Error:** Error card with a Retry button.

---

## 1. Global Layout

### 1.1 Shell Structure

**Desktop (≥ 1024px):**
```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR  (fixed, full width, height 56px, z-index 50)   │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   SIDEBAR    │           MAIN CONTENT AREA             │
│  (fixed,     │    (scrollable, padding 24px 32px)      │
│  left, 240px)│                                         │
│              │                                         │
└──────────────┴──────────────────────────────────────────┘
```

**Tablet (640px–1023px):**
```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (fixed, full width, height 56px)                │
├──────┬──────────────────────────────────────────────────┤
│      │                                                  │
│ SIDE │           MAIN CONTENT AREA                     │
│ BAR  │    (scrollable, padding 16px 20px)              │
│(48px)│                                                  │
│icons │                                                  │
└──────┴──────────────────────────────────────────────────┘
```

**Mobile (< 640px):**
```
┌──────────────────────────────────┐
│  TOPBAR (fixed, height 56px)     │
├──────────────────────────────────┤
│                                  │
│      MAIN CONTENT AREA          │
│  (scrollable, padding 16px)     │
│                                  │
│                                  │
└──────────────────────────────────┘
[Sidebar rendered as drawer overlay, hidden by default]
```

### 1.2 Topbar

**Position:** Fixed top, full viewport width, height 56px, white background, bottom border `1px solid #E5E7EB`, `z-index: 50`.

**Desktop layout (flex row, items centered, padding 0 24px):**
- **Left:** Application wordmark "CourseFlow" in semibold 18px, indigo color. Clicking navigates to `/dashboard`.
- **Right (flex row, gap 12px):** Notification bell icon button → placeholder. Role badge pill → color-coded per role. User avatar + name dropdown.

**Mobile layout (flex row, space-between, padding 0 16px):**
- **Left:** Hamburger icon button (☰, 44×44px touch target). Tapping opens sidebar drawer.
- **Center:** "CourseFlow" wordmark.
- **Right:** User avatar circle (32px, initials-based). Tapping opens a bottom sheet with: "My Profile", "Sign Out".

The role badge and notification bell do not appear in the mobile topbar. The role badge is shown inside the sidebar drawer under the user name.

**Role badge color map:** `ADMIN` → indigo, `HOD` → violet, `LECTURER` → sky, `STUDENT` → emerald.

**User dropdown (desktop):** Appears below the avatar on click. White card, rounded-lg, shadow-lg, min-width 180px. Items: "My Profile" → `/profile`, separator, "Sign Out" → clears token, redirects to `/login`.

**Avatar:** 32px circle, background color derived from a deterministic hash of `user.name`, white initials text (first letter of first and last name).

### 1.3 Sidebar

**Desktop (≥ 1024px):** Fixed left, top 56px, height `calc(100vh - 56px)`, width 240px, white background, right border `1px solid #E5E7EB`, overflow-y auto, `z-index: 40`.

**Tablet (640px–1023px):** Fixed left, top 56px, height `calc(100vh - 56px)`, width 48px, white background, right border. Shows icons only, no labels. Hovering an icon shows a tooltip with the label. Same `z-index: 40`.

**Mobile (< 640px):** Hidden by default. Opens as a **left drawer overlay** when the hamburger is tapped. Width: 80vw, maximum 300px. Full height from top 0 (overlaps topbar). `z-index: 60`. Semi-transparent backdrop (`background: rgba(0,0,0,0.4)`) covers the rest of the screen. Tapping the backdrop closes the drawer. The drawer slides in from the left with a 250ms ease-out transition.

**Mobile sidebar top section:** Inside the drawer, above the nav items, show a user panel: avatar (40px) + name (14px semibold) + role badge pill. This replaces the role badge that is not shown in the mobile topbar.

**Navigation items (rendered in order):**

Each item is a full-width anchor. Desktop: icon (20px) + label, padding 12px 16px, border-radius 6px. Tablet: icon only, centered, padding 14px. Mobile (inside drawer): icon (20px) + label, padding 14px 20px.

Active state: `background: #EEF2FF`, `color: #4F46E5`, icon filled. Hover/press: `background: #F9FAFB`.

| Label | Route | Visible to |
|-------|-------|-----------|
| Dashboard | `/dashboard` | All |
| Academic Sessions | `/sessions` | ADMIN |
| Departments | `/departments` | All |
| Courses | `/courses` | All |
| Lecturers | `/lecturers` | ADMIN, HOD |
| Students | `/students` | ADMIN, HOD |
| Schedules | `/schedules` | All |
| Exams | `/exams` | All |
| Complaints | `/complaints` | All |
| Verification Codes | `/verification-codes` | ADMIN |

**Bottom of sidebar (desktop only, pinned):** Separator line. "Settings" → `/settings`. User name + "Sign out" text button.

---

## 2. Authentication Pages

Authentication pages share a layout component. Do not render the sidebar or topbar on any authentication page.

**Desktop (≥ 1024px):** Two-column layout. Left column: 55% width, indigo-700 to indigo-900 gradient background, vertically and horizontally centered logo + tagline "Manage your university, effortlessly." Right column: 45% width, white, vertically and horizontally centered form, padding 48px.

**Mobile/Tablet (< 1024px):** Single column, white, full width. Padding 24px. Logo centered at top, form below.

### 2.1 Login Page — `/login`

**Page title:** "Sign in to CourseFlow" (24px bold)
**Subtitle:** "Enter your credentials to continue" (14px, gray-500)

**Form fields (vertical stack, gap 20px):**

| Field | Type | Placeholder | Validation |
|-------|------|-------------|-----------|
| Email address | `email` | `you@university.edu` | Required, valid email |
| Password | `password` | `••••••••` | Required, min 6 chars |

**Password field:** Show/hide toggle button inside the right of the input field (eye icon, 44×44px touch target).

**Below password field:** "Forgot password?" right-aligned text link (14px, indigo) → `/forgot-password`.

**Submit button:** Full width, height 44px, indigo background, "Sign in", shows centered spinner replacing text on submission. Disabled during submission.

**On submit:** Call `apiClient.login(email, password)`. On `success: true`, call `apiClient.setToken(data.access_token)`, store `data.user` in global auth state, redirect to `/dashboard`. On `success: false`, show inline error banner above submit button with `response.error`. Clear the password field on error.

**Below submit button:** "Don't have an account? Register" center-aligned (14px). "Register" is an indigo link → `/register`.

### 2.2 Register Page — `/register`

**Page title:** "Create your account"
**Subtitle:** "Fill in your details to get started"

**Form fields (vertical stack, gap 20px):**

| Field | Type | Placeholder | Condition | Notes |
|-------|------|-------------|-----------|-------|
| Full name | `text` | `John Doe` | Always | Optional |
| Matric / Staff number | `text` | `CS/2023/001` | Always | Required |
| Email address | `email` | `you@university.edu` | Always | Required |
| Password | `password` | `••••••••` | Always | Required, min 6, show/hide toggle |
| Confirm password | `password` | `••••••••` | Always | Client-side match validation only |
| Role | `select` | — | Always | Options: Student (default), Lecturer, HOD, Admin |
| Department | `select` | `Select department...` | Role ≠ Admin | Required for Student, Lecturer, HOD |
| Verification code | `text` | `XXXX-XXXX` | Role = Lecturer, HOD, or Admin | Required for those roles |
| Phone number | `text` | `+234 800 000 0000` | Role = Lecturer or HOD | Optional |

**Department select:** On page mount, call `apiClient.getDepartments()`. Populate with `department.name` as label, `department.code` as value. Show a loading spinner inside the select while fetching. If fetch fails, show "Failed to load departments. Retry." inside the select with a retry link.

**Role field change handler:** When role changes, conditionally show or hide Department, Verification code, and Phone fields with a smooth height transition. Do not unmount the fields — just hide them and clear their values to avoid stale validation.

**Submit button:** Full width, height 44px, indigo, "Create account". Spinner on submission.

**On submit:** Call `apiClient.register(formData)`. On success, set token, store user, redirect to `/dashboard`. On failure, display `response.error` in error banner above the submit button.

**Below submit:** "Already have an account? Sign in" → `/login`.

### 2.3 Forgot Password Page — `/forgot-password`

**Page title:** "Reset your password"
**Subtitle:** "Enter your email and we'll send you a reset link"

**Form fields:** Email address only.

**Submit:** Call `apiClient.forgotPassword(email)`. Regardless of the response (the backend always returns 200), replace the form with a success message card:

```
[CheckCircle icon — green, 48px]
"Check your email"
"If an account exists with that email address, you
will receive a password reset link shortly."

[← Back to login]
```

### 2.4 Reset Password Page — `/reset-password`

Read the `token` query parameter from the URL on page mount. If no token is present, redirect to `/forgot-password`.

**Page title:** "Set a new password"

**Form fields:** New password (with show/hide toggle), Confirm new password.

**Submit:** Call `apiClient.resetPassword(token, newPassword)`. On success, show a success state and redirect to `/login` after 3 seconds. On failure, show error banner. Common failure: "Invalid or expired reset token" — in this case also show a "Request a new link" button → `/forgot-password`.

---

## 3. Dashboard — `/dashboard`

The dashboard is role-aware. It renders different content depending on the authenticated user's role.

### 3.1 Layout

**Page header:** "Dashboard" (24px semibold) + greeting "Good morning, {user.name}" (14px gray-500). The greeting adjusts based on time of day: Good morning (5–11), Good afternoon (12–17), Good evening (18–4).

**Stat cards row:**
- Desktop: 4 cards in a single row, equal width, gap 16px.
- Tablet: 2×2 grid, gap 16px.
- Mobile: 2×2 grid, gap 12px.

Each card: white, rounded-xl, border `1px solid #E5E7EB`, padding 20px, shadow-sm. Contains: colored icon circle (40px) top-left, metric value (28px bold) below icon, metric label (13px gray-500) below value.

### 3.2 ADMIN Dashboard

**On mount, fetch in parallel:**
- `apiClient.getDepartmentStatistics()`
- `apiClient.getCourseStatistics()`
- `apiClient.getScheduleStatistics()`
- `apiClient.getActiveAcademicSession()`

**Stat cards:**
1. Total Departments — `departmentStatistics.totalDepartments` — Building2 icon — indigo background.
2. Total Courses — `courseStatistics.totalCourses` — BookOpen icon — violet background.
3. Total Schedules — `scheduleStatistics.totalSchedules` — Clock icon — sky background.
4. Active Session — `activeSession.name` or "None" — CalendarDays icon — emerald background.

**Charts row (below stats):**

Desktop: two side-by-side white cards, equal width, rounded-xl, border, padding 20px.
Mobile: two stacked white cards.

Left card — "Courses by Level": Horizontal bar chart. Y-axis: 100L through 500L. X-axis: count. Data: `courseStatistics.coursesByLevel`.

Right card — "Schedules by Day": Vertical bar chart. X-axis: Mon–Fri. Y-axis: count. Data: `scheduleStatistics.schedulesByDay`. Saturday and Sunday are excluded from display.

**Quick actions row (below charts):**

Desktop: three cards side by side. Mobile: vertical stack.

Each action card: white, rounded-xl, border, padding 20px. Contains: icon + title (16px semibold) + description (13px gray-500) + CTA button.

1. "Generate Schedules" — "Auto-generate timetables for the active session" — "Generate" button (indigo) → opens Generate Schedule Modal (§7.5).
2. "Pending Complaints" — shows pending count as a large number — "View Complaints" button → `/complaints`.
3. "Academic Session" — shows active session name — "Manage Sessions" button → `/sessions`.

### 3.3 HOD Dashboard

**On mount, fetch:**
- `apiClient.getLecturerDashboard()`
- `apiClient.getDepartmentByCode(user.departmentCode)`

**Stat cards (2×2 on all screen sizes):**
1. My Courses — `dashboard.totalCourses`.
2. Scheduled Classes — `dashboard.totalSchedules`.
3. Upcoming Classes — `dashboard.upcomingClasses`.
4. Department Schedule — `department.isScheduleLocked ? "Locked" : "Unlocked"` — padlock icon — amber if locked, green if unlocked. Tapping this card toggles the lock state (confirmation dialog first).

**Below stats:** "My Schedule This Week" — renders the mobile timetable format (day tabs + single-day vertical timeline, §7.3 Mobile). Read-only. "View Full Schedule" link → `/schedules`.

### 3.4 LECTURER Dashboard

Same as HOD dashboard but without the lock status card and without any "Generate" action. The schedule section is read-only with no edit controls.

### 3.5 STUDENT Dashboard

**On mount, fetch:**
- `apiClient.getSchedules()`
- `apiClient.getExams()`

**Stat cards (2×2):** Total courses this semester, Upcoming exams, Next exam date, Next class today.

**Below stats:**
- "This Week's Schedule" — mobile timetable format, read-only.
- "Upcoming Exams" — list of next 5 exams ordered by date. Each item: date (bold) + course code + venue. "View All Exams" link → `/exams`.

---

## 4. Modals — Universal Behaviour

All modals follow these rules before any page-specific specifications.

**Desktop (≥ 640px):** Centered overlay. Semi-transparent backdrop `rgba(0,0,0,0.5)`. Modal card: white, rounded-2xl, shadow-2xl. Width varies by content (specified per modal). Max-height: 90vh, internal scroll on the body section if content overflows. Enters with a subtle scale-in + fade animation (150ms).

**Mobile (< 640px):** **Bottom sheet pattern.** The modal slides up from the bottom of the viewport. Width: 100%. Border-radius only on top corners (20px). Maximum height: 90vh. A drag handle (40×4px, gray-300, centered, margin-top 12px) sits at the very top. The user can swipe down to dismiss. The backdrop is the same as desktop. Enters with a slide-up animation (250ms ease-out).

**All modals — structure:**
```
[Drag handle — mobile only]
[Header: Title (18px semibold) + X close button (44×44px)]
[Divider]
[Body: scrollable, padding 24px, padding-bottom 8px]
[Divider]
[Footer: action buttons, padding 16px 24px,
         padding-bottom: max(16px, env(safe-area-inset-bottom))]
```

**Footer button layout:**
- Desktop: right-aligned. "Cancel" (ghost/outline, gray) on the left, primary action (indigo, filled) on the right.
- Mobile: full-width stacked buttons. Primary action on top, "Cancel" below it (both full width, height 44px).

**Closing:** X button, backdrop tap, Escape key (desktop), swipe down (mobile).

---

## 5. Academic Sessions — `/sessions` (ADMIN only)

### 5.1 Page Layout

**Page header row (flex, space-between, flex-wrap, gap 12px):**
- Left: "Academic Sessions" heading (24px semibold).
- Right: "+ New Session" button (indigo, filled, height 40px).

**Sessions list (margin-top 24px):** Vertical stack of cards, gap 12px.

### 5.2 Session Card

White card, rounded-xl, border, padding 20px 24px, shadow-sm.

**Desktop layout:**
```
[Active/Archived badge]   2024/2025 (20px semibold)    [Edit] [Stats] [Delete]
                          01 Sep 2024 → 31 Jul 2025
                          150 schedules · 45 exams
                          [Activate button — if archived] [Archive button — if active]
```

**Mobile layout:** Same content but stacked. Action buttons move to a single "..." overflow button in the top-right that opens a bottom sheet.

**Status badge:** "Active" — green pill. "Archived" — gray pill.

**Action buttons (desktop, flex row, gap 8px, right-aligned):**
- If archived: "Activate" (small, indigo outline, height 36px) → `apiClient.activateAcademicSession(id)` with confirmation.
- If active: "Archive" (small, gray outline, height 36px) → `apiClient.archiveAcademicSession(id)` with confirmation.
- Statistics icon button (BarChart2, 44×44px touch target) → opens Statistics Modal.
- Edit icon button (Pencil, 44×44px) → opens Edit Modal.
- Delete icon button (Trash2, red, 44×44px) → confirmation dialog → `apiClient.deleteAcademicSession(id)`.

### 5.3 Create/Edit Session Modal

**Width (desktop):** 480px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Session name | `text` | e.g. "2024/2025". Required. |
| Start date | `date` | ISO date picker. Required. |
| End date | `date` | Must be after start date. Validated on submit. Required. |

**Footer:** "Cancel" + "Create Session" / "Save Changes".

**On submit create:** `apiClient.createAcademicSession(data)`. Close modal, re-fetch list, toast "Session created."

### 5.4 Session Statistics Modal

**Width (desktop):** 440px.

**Title:** "Statistics — {session.name}"

**Fetches:** `apiClient.getSessionStatistics(id)` on modal open. Shows skeleton while loading.

**Content:** 2×2 grid of stat numbers:
- Total Schedules, First Semester Schedules, Second Semester Schedules, Total Exams.

---

## 6. Departments — `/departments`

### 6.1 Page Layout

**Page header row (flex, space-between, flex-wrap, gap 12px):**
- Left: "Departments" heading.
- Right (flex row, gap 8px): "Download Template" (ghost button, Download icon) | "Upload CSV" (outline button, Upload icon) | "+ New Department" (indigo, ADMIN only).

**Filter bar (margin-top 16px):** See §6.2.

**Departments grid (margin-top 16px):**
- Desktop (≥ 1280px): 3 columns, gap 16px.
- Tablet (768px–1279px): 2 columns, gap 16px.
- Mobile (< 768px): 1 column, gap 12px.

### 6.2 Filter Bar

**Desktop:** White card, rounded-xl, border, padding 12px 20px, horizontal flex row, gap 12px, items centered.

Elements left to right:
1. Search input (flex-grow 1, min-width 200px): magnifying glass icon inside left, placeholder "Search by name or code...". Debounced 300ms → sets `searchTerm` param.
2. "Has Courses" toggle button (height 36px, outline): when active, solid indigo fill. Sets `hasCourses: true`.
3. "Without Courses" toggle button (height 36px, outline): sets `withoutCourses: true`.
4. Per-page select (right-aligned, width 80px): 10 / 25 / 50.

**Mobile:** Search input (full width, height 44px) always visible above the content area. A "Filters" button (funnel icon + "Filters" label + count badge if active, height 44px, outline style) sits to the right of the search input on the same row.

Tapping "Filters" opens a **bottom sheet** containing:
- "Has Courses" toggle (full-width, pill style).
- "Without Courses" toggle (full-width).
- "Per page" select.
- "Apply" button (full width, indigo, height 44px) — fires the query and closes the sheet.
- "Clear Filters" text link — resets all and closes.

### 6.3 Department Card

White card, rounded-xl, border `1px solid #E5E7EB`, padding 20px, shadow-sm, hover shadow-md (150ms transition). Minimum height 160px.

```
[College badge]                                    [Lock icon if isScheduleLocked]
Department Name (18px semibold, gray-900)
Department Code (12px monospace, indigo-600, bg-indigo-50, px-2 rounded)
Description (14px gray-500, 2-line clamp, margin-top 8px)

─────────────────────────────────────────────────
HOD: [Avatar 24px] Dr. Name (14px)    [··· menu button]
```

**College badge:** Pill, top-left. "CBAS" → blue-100 text blue-700. "CHMS" → purple-100 text purple-700.

**Lock icon:** If `isScheduleLocked === true`, padlock icon (Lock, 16px, amber-500) top-right. Paired with a tooltip "Schedule locked" on hover.

**HOD section:** If no HOD, show "No HOD assigned" in gray-400 italic.

**Action menu button ("···"):** Always visible (not just on hover) for accessibility. 44×44px touch target. Positioned bottom-right.

**Desktop dropdown menu contents (based on role):**
- "View Details" → `/departments/{code}` (All roles).
- "Edit Department" → Edit Modal (ADMIN only).
- Separator.
- "Lock Schedule" → confirmation → `apiClient.lockDepartmentSchedule(code)`. Shown if `!isScheduleLocked`. (ADMIN and HOD of this department only.)
- "Unlock Schedule" → confirmation → `apiClient.unlockDepartmentSchedule(code)`. Shown if `isScheduleLocked`. (ADMIN and HOD of this department only.)
- Separator.
- "Delete Department" → confirmation → `apiClient.deleteDepartment(code)`. (ADMIN only, red text.)

**Mobile:** The "···" button opens a **bottom sheet** with the same items as full-height tap targets (height 52px each).

### 6.4 Mobile Department Card

```
┌─────────────────────────────────────────────────┐
│ [CBAS]                                   [🔒]   │
│ Computer Science                                 │
│ CSC                                             │
│ Study of computation and systems                │
│ ─────────────────────────────────────────────── │
│ HOD: Dr. Alan Turing              [···]         │
└─────────────────────────────────────────────────┘
```

Tapping anywhere on the card (except the "···" button) navigates to the department detail page.

### 6.5 Department Detail Page — `/departments/[code]`

**Fetch on mount:** `apiClient.getDepartmentFullDetails(code)`.

**Back navigation:** Arrow-left icon + "Departments" text link at top of page.

**Page title section:** Department name (28px bold) + college badge + lock status badge (amber "Locked" or green "Unlocked").

**Info grid (margin-top 24px):**
- Desktop: 2 columns side by side.
- Mobile: stacked.

Left card — "Head of Department": Avatar (48px) + name (16px semibold) + email (14px gray-500) + role badge. If unassigned: "Not assigned" + "Assign HOD" button (ADMIN only → opens Edit modal).

Right card — "Department Info": Code, College, Status (Active/Inactive), Schedule lock status + toggle button (ADMIN or HOD of this dept only).

**Courses section (margin-top 32px):**

"Courses in this Department" heading + "Add Course" button (ADMIN/HOD, right-aligned).

Desktop: Table with columns Code | Name | Level | Semester | Credits | Lecturer | Actions.
Mobile: Card list (see §7 course card format).

### 6.6 Create/Edit Department Modal

**Width (desktop):** 520px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Department name | `text` | Max 100 chars. Required. |
| Department code | `text` | 2–4 uppercase letters. Auto-uppercased on input. Required. |
| Description | `textarea` | Max 1000 chars. Optional. Rows 3. |
| College | `select` | CBAS, CHMS. Required. |
| Head of Department | `combobox` | Optional. See below. |

**HOD combobox:** On focus or type, calls `apiClient.getUsers({ role: 'HOD' })` and `apiClient.getUsers({ role: 'LECTURER' })`, merges, deduplicates, filters by typed name. Each option shows: avatar initials + name + email in smaller gray text. Sends `hodId` (user `id`). Minimum input length to search: 1 character.

### 6.7 CSV Bulk Upload Flow

**Download Template:** Calls `apiClient.getDepartmentsBulkTemplate()`, triggers browser file download named `departments-template.csv`.

**Upload CSV:** Opens a modal (desktop: 480px wide, mobile: bottom sheet).

Modal content: Drag-and-drop zone (dashed border, rounded-xl, padding 40px, centered icon + "Drop your CSV file here or click to browse" text). Accept `.csv` only. File size limit: 5MB. Below the zone: "Download template" link.

After file selection, show file name + file size in the zone with a remove (×) button.

"Upload" button (indigo, full width on mobile) → `apiClient.uploadDepartmentsBulk(file)`.

**On response:**

If all success: green banner "X departments created successfully."

If mixed: show a two-section result:
- Green summary: "X created, Y failed."
- Scrollable error table: Row | Field | Value | Error Message. Max height 240px, internal scroll.

---

## 7. Courses — `/courses`

### 7.1 Page Layout

**Page header row (flex, space-between, flex-wrap, gap 12px):**
- Left: "Courses" heading.
- Right: "Download Template" (ghost) | "Upload CSV" (outline) | "+ New Course" (indigo, ADMIN/HOD only).

**Filter bar (margin-top 16px).** See §7.2.

**Courses table / card list (margin-top 16px).** See §7.3.

### 7.2 Filter Bar

**Desktop:** White card, rounded-xl, border, padding 12px 20px, horizontal flex row, flex-wrap, gap 12px.

Elements:
1. Search input (min-width 200px, flex-grow 1): placeholder "Search by code, name or lecturer...". Debounced 300ms → `searchTerm` param.
2. Department select (min-width 160px): "All Departments" default. Sets `departmentCode`.
3. Level select (min-width 130px): "All Levels", then "100 Level" through "500 Level". Sets `level`.
4. Semester select (min-width 150px): "All Semesters", "First Semester", "Second Semester". Sets `semester`.
5. "General Only" toggle button: sets `isGeneral: true`. Hidden when a specific department is selected.
6. "Clear Filters" text button (gray-500, 14px): only visible when any filter is active. Resets all filters.

**Mobile:** Search input (full width) + "Filters (N)" button on same row. Tapping "Filters" opens bottom sheet with all other controls stacked, plus "Apply" and "Clear All" buttons.

### 7.3 Courses Table

**Desktop/Tablet:** White card, rounded-xl, border, shadow-sm. Table with sticky header row (background: white, `z-index: 10`).

**Columns:**

| Column | Content | Desktop width | Tablet |
|--------|---------|---------------|--------|
| Code | Monospace chip, indigo-50 bg | 100px | Show |
| Name | Course name, wraps | auto | Show |
| Level | Level pill (color-coded) | 100px | Show |
| Semester | "First" / "Second" | 80px | Hide |
| Credits | Centered number | 70px | Hide |
| Department | Dept code chip | 90px | Show |
| Lecturer | Name or "Unassigned" italic | 160px | Show |
| Status | Active/Inactive/Locked pill | 80px | Hide |
| Actions | Icon buttons | 80px | Show |

**Level pill colors:** 100 → slate-100/slate-700, 200 → blue-100/blue-700, 300 → violet-100/violet-700, 400 → orange-100/orange-700, 500 → red-100/red-700.

**Status pill:** Active → green, Inactive → gray, Locked → amber with padlock icon.

**Actions column (desktop, flex row, gap 4px, all 44×44px):**
- Eye icon → opens Course Detail Sheet.
- Pencil icon → opens Edit Course Modal. ADMIN and HOD of that department only.
- Trash icon (red) → confirmation → `apiClient.deleteCourse(code)`. ADMIN only.

**Mobile (< 768px):** Table transforms into a vertical card list. Each card:

```
┌───────────────────────────────────────────────┐
│ CSC101                            [100 Level] │
│ Introduction to Computer Science              │
│ Dr. Alan Turing · Computer Science            │
│ First Semester · 3 Credits                    │
│ ─────────────────────────────────────────────  │
│ [Active]                           [···]      │
└───────────────────────────────────────────────┘
```

"···" opens bottom sheet with: "View Details", "Edit Course" (ADMIN/HOD), "Delete Course" (ADMIN, red).

Tapping the card body opens the Course Detail Sheet.

### 7.4 Course Detail Sheet

**Desktop:** Slide-in panel from the right. Width 480px. Overlays content with a backdrop. Enters with slide-left animation (250ms).

**Mobile:** Full-screen modal with a back arrow at the top-left instead of an X button.

**Header:** Course code (monospace, indigo chip) + course name (20px semibold). Close/back button.

**Body sections (vertical stack, gap 24px):**

1. **General Info** — 2×N key-value grid: Level, Semester, Credits, Department, Session. Status badges: Active/Inactive, General/Specific, Locked/Unlocked.

2. **Overview** — full width. Text or "No overview provided." in gray italic.

3. **Lecturer** — white sub-card, rounded-lg, border. Avatar (40px) + name + email + department code. "Change Lecturer" button (outline, small). ADMIN/HOD only.

4. **Schedule** — white sub-card. Current schedule (day + start–end time) or "Not yet scheduled" + "Add to Schedule" button (ADMIN/HOD).

**Footer (ADMIN/HOD only):** "Edit Course" button (full width on mobile, outline indigo).

### 7.5 Create/Edit Course Modal

**Width (desktop):** 560px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Course code | `text` | Pattern `^[A-Z]{2,4}\d{3}$`. Auto-uppercased. Required. |
| Course name | `text` | Max 200 chars. Required. |
| Overview | `textarea` | Max 2000 chars. Rows 4. Optional. |
| Level | `select` | 100 Level through 500 Level. Required. |
| Semester | `select` | First, Second. Required. |
| Credits | `number` | 1–6. Required. |
| Department | `select` | Populated from `getDepartments()`. Required. |
| Lecturer | `combobox` | See below. |
| Is General Course | `checkbox` | ADMIN only. |
| Is Locked | `checkbox` | ADMIN only. |

**Lecturer combobox:** On department selection, call `apiClient.getUsers({ role: 'LECTURER', departmentCode: selectedCode })`. Each option: avatar initials + name + email. Sends `lecturerId` (user `id`). If no department selected, search across all lecturers.

---

## 8. Schedules — `/schedules`

This is the most complex page. Two view modes: **Timetable (default)** and **List**.

### 8.1 Page Layout

**Page header row (flex, space-between, flex-wrap, gap 12px):**
- Left: "Schedules" heading + session badge showing active session name and semester (e.g. "2024/2025 · First Semester", indigo pill, 13px).
- Right (flex row, gap 8px): View toggle (List | Timetable, segmented control) | "+ Manual Schedule" (outline, ADMIN/HOD only) | "Generate" (indigo, ADMIN/HOD only).

**Mobile header:** "Schedules" heading + "Generate" button only. View toggle and "+ Manual" button move to a secondary row below the header.

**Filter bar (margin-top 16px).** See §8.2.

**Content area (margin-top 16px).** Timetable or List based on toggle.

### 8.2 Filter Bar

**Desktop:** White card, rounded-xl, border, padding 12px 20px, horizontal flex row, flex-wrap, gap 12px.

Elements:
1. Session select: populated from `getAcademicSessions()`. Defaults to active session. Sets `sessionId`.
2. Semester select: "First Semester" / "Second Semester". Sets `semester`.
3. Department select: "All Departments". Sets `departmentCode`.
4. Level select: "All Levels", 100–500. Sets `level`.
5. Day select (visible in Timetable view only): "All Days", Monday–Friday.
6. "Clear Filters" text button (only when filters are active).

**Mobile:** Search + "Filters (N)" pattern same as Departments and Courses.

### 8.3 Timetable View — Desktop (≥ 768px)

The timetable is a CSS Grid calendar.

**Grid dimensions:**
- Time label column: 64px, fixed, sticky left.
- Day columns: 5 equal-width columns filling remaining space.
- Time rows: 10 rows (09:00 through 18:00 start times, each 60px tall). Visual height of a 2-hour class: 120px.

**Grid header row (sticky top):**
- First cell: empty (above time labels).
- Remaining 5 cells: day names. Monday through Friday. Wednesday cell has a subtle amber-50 background.
- Each day header: day name (14px semibold, gray-700) + today highlight if applicable (indigo circle around date number).

**Time labels column (sticky left):**
Each cell shows the hour: "09:00", "10:00" ... "18:00". 13px, gray-400. Vertically centered in its 60px row.

**Wednesday column visual cutoff:** Cells from row 15:00 onward in the Wednesday column render with a `bg-gray-100` background and a subtle diagonal stripe pattern (CSS `repeating-linear-gradient`). A tooltip on hover: "Wednesday classes end at 15:00."

**Schedule block rendering:**

For each schedule in the fetched data:
- `gridColumn`: MONDAY=2, TUESDAY=3, WEDNESDAY=4, THURSDAY=5, FRIDAY=6.
- `gridRowStart`: (startHour - 9) + 2. (Row 1 is header, row 2 = 09:00.)
- `gridRowSpan`: 2 (all classes are exactly 2 hours).

**Block appearance:**
- Rounded-lg (6px), padding 8px 10px, overflow hidden.
- Background: deterministic color from department code (see color table below).
- Left border: 3px solid, a darker shade of the background color.
- Full height fills the 2-row span (120px minus grid gaps).

**Department color table (background → border):**

| Hash index | Background | Border |
|-----------|-----------|--------|
| 0 | blue-100 | blue-400 |
| 1 | violet-100 | violet-400 |
| 2 | emerald-100 | emerald-400 |
| 3 | orange-100 | orange-400 |
| 4 | pink-100 | pink-400 |
| 5 | sky-100 | sky-400 |
| 6 | amber-100 | amber-400 |
| 7 | teal-100 | teal-400 |

Assign by: `hashIndex = sum of char codes of departmentCode % 8`.

**Block content (top to bottom):**
```
[Dept chip — 10px monospace]      [🔒 if isFixed] [● amber if isManualOverride]
Course Code (12px semibold monospace, gray-900)
Course Name (11px gray-600, single line, ellipsis)
09:00 – 11:00 (11px gray-500)
```

**Hover state:** Block lifts with `box-shadow: 0 4px 12px rgba(0,0,0,0.12)`, cursor pointer. Shows a tooltip with full course name if truncated.

**Click:** Opens Schedule Detail Sheet.

**Empty cell on hover (ADMIN/HOD only):** Shows a dashed border (border-dashed, gray-300) and a centered "+" icon (gray-400). Clicking opens the Create Schedule Modal pre-filled with that day and start time.

### 8.4 Timetable View — Mobile (< 768px)

The full 5-column grid is replaced with a **day-picker + single-day vertical timeline**.

**Day picker:** Horizontal scrollable row of pill buttons at the top of the content area: MON | TUE | WED | THU | FRI. Each pill: height 36px, min-width 52px, rounded-full. Active pill: indigo background, white text. Inactive: gray-100 background, gray-700 text. The currently active day is always visible without scrolling (center the active pill on selection).

**Single-day timeline (below day picker):**

Vertical list of time slots from 09:00 to 18:00. Each time slot: row height 80px minimum, left side shows time label (12px, gray-400, width 48px, sticky left). Right side shows the schedule block if one exists.

**Mobile schedule block:**
```
┌─────────────────────────────────────────────┐
│ [CSC]  CSC101                               │
│ Introduction to Computer Science            │
│ 09:00 – 11:00  [Manual ●]                  │
└─────────────────────────────────────────────┘
```

Height: 72px. Rounded-lg. Same color coding as desktop. Tapping opens Schedule Detail Sheet (full-screen on mobile).

**Empty time slots on mobile:** Show a faint dashed row. ADMIN/HOD: tapping an empty slot opens Create Schedule Modal.

### 8.5 List View

White card, rounded-xl, border, shadow-sm. Sortable table.

**Columns:**

| Column | Content | Mobile |
|--------|---------|--------|
| Day | Day name | Show |
| Time | "09:00 – 11:00" | Show |
| Course Code | Monospace chip | Show |
| Course Name | Text | Hide on mobile |
| Department | Dept code chip | Hide on mobile |
| Level | Level pill | Hide on mobile |
| Semester | First/Second | Hide on mobile |
| Type | Auto/Manual/Fixed chip | Show |
| Actions | Edit + Delete | Show |

**Type chips:** "Auto-generated" → gray-100/gray-600. "Manual Override" → amber-100/amber-700. "Fixed" → indigo-100/indigo-700 with padlock icon.

**Sorting:** Clicking column headers cycles asc → desc → default. Default sort: Day ASC, Time ASC.

**Mobile list view:** Same card-per-row pattern as other tables:

```
┌───────────────────────────────────────────────┐
│ Monday · 09:00 – 11:00          [Manual ●]   │
│ CSC101 · Introduction to CS                   │
│ Computer Science · 100 Level                  │
│ ─────────────────────────────────────────────  │
│                                    [···]      │
└───────────────────────────────────────────────┘
```

### 8.6 Generate Schedules Modal

**Width (desktop):** 520px.

**Title:** "Generate Schedules"

**Warning banner (amber-50 background, amber-600 border-left 3px, padding 12px 16px, rounded-lg):**
"This will delete all existing auto-generated schedules for the selected scope and regenerate them. Manual overrides and fixed schedules will be preserved."

**Fields:**

| Field | ADMIN | HOD |
|-------|-------|-----|
| Semester | `select`, editable | `select`, editable |
| Session | `select`, defaults to active | `select`, defaults to active |
| Department scope | `select`: "All Unlocked Departments" or a specific dept | Read-only display of own department |

**Footer:** "Cancel" + "Generate Schedules" (indigo, spinner on submit).

**On submit:** `apiClient.generateSchedules({ semester, sessionId, departmentCode })`.

**On success:** Replace modal content with a result summary (do not close, do not navigate):

```
[CheckCircle icon — green, 40px, centered]
"Schedule Generation Complete"  (18px semibold, centered)
────────────────────────────────────────
Session          2024/2025
Semester         First
Total Courses    178
Scheduled        165
Preserved        13 manual overrides
Skipped          2 locked departments
────────────────────────────────────────
[Close]          [View Schedules]
```

"View Schedules" closes the modal and ensures the schedules page re-fetches.

**On 422 error:** Replace modal content with error state:

```
[AlertCircle icon — red, 40px]
"Scheduling Failed"
"Could not find valid time slots for the following courses:"
[Scrollable list of course codes]
"Try reducing the number of courses per department/level or contact an administrator."
[Close]   [Try Again]
```

### 8.7 Create/Edit Schedule Modal

**Width (desktop):** 480px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Course | `combobox` | Search by code or name. Required. |
| Day of week | `select` | Monday–Friday only. Required. |
| Start time | `select` | 09:00 – 17:00 (1-hour increments). Wednesday options stop at 13:00. Required. |
| End time | `display` | Read-only. Auto-shows startTime + 2 hours. |
| Pin this slot (isFixed) | `checkbox` | "Fix this slot so auto-generation never moves it." |

**Inline validation:**
- Wednesday + startTime ≥ 14:00: show inline error "Wednesday classes must end by 15:00."
- If a schedule already exists for this course in the active session: show inline error "This course already has a schedule. Editing will update the existing one."

**End time display:** Render as a read-only input or a gray well, clearly labeled "End time (auto-calculated)".

### 8.8 Schedule Detail Sheet

**Desktop:** Slide-in from right, width 420px, with backdrop.
**Mobile:** Full-screen.

**Header:** Course code chip + course name. Close/back button.

**Body:**
- Day + time range: "Monday, 09:00 – 11:00" (18px semibold).
- Session + semester (14px, gray-500).
- Status badge row: one of Auto-generated / Manual Override / Fixed (with lock icon).
- Course info mini-card: level pill, department chip, lecturer name + email.

**Footer (ADMIN/HOD only):**
- "Edit Schedule" → opens Edit Modal.
- "Delete Schedule" → confirmation → `apiClient.deleteSchedule(id)`. If `isFixed: true` and user is not ADMIN, the delete button is disabled with tooltip "This slot is fixed. Contact an admin to remove it."

---

## 9. Exams — `/exams`

### 9.1 Page Layout

**Page header row:**
- Left: "Exam Schedule" heading.
- Right: "+ Schedule Exam" (indigo, ADMIN only).

**Filter bar (margin-top 16px).** Desktop: Session select | Semester select | Search by course code. Mobile: search always visible + "Filters" button.

**Exam table (margin-top 16px).**

### 9.2 Exam Table

**Desktop columns:**

| Column | Content |
|--------|---------|
| Date | "Mon, 15 Dec 2025" |
| Time | "09:00 – 11:00" |
| Course | Code chip + course name. CBT badge (indigo "CBT" chip) if 100L or isGeneral. |
| Level | Level pill |
| Venue | Human-readable venue name (see mapping below) |
| Students | Count |
| College | CBAS/CHMS pill or "—" |
| Invigilators | Text, truncated |
| Actions | Edit + Delete (ADMIN only) |

**VenueType to display label mapping:**

| Enum | Display |
|------|---------|
| UNIVERSITY_ICT_CENTER | University ICT Centre |
| ICT_LAB_1 | ICT Lab 1 |
| ICT_LAB_2 | ICT Lab 2 |
| COMPUTER_LAB | Computer Lab |
| LECTURE_HALL_1 | Lecture Hall 1 |
| LECTURE_HALL_2 | Lecture Hall 2 |
| LECTURE_HALL_3 | Lecture Hall 3 |
| AUDITORIUM_A | Auditorium A |
| AUDITORIUM_B | Auditorium B |
| SEMINAR_ROOM_A | Seminar Room A |
| SEMINAR_ROOM_B | Seminar Room B |
| ROOM_101 | Room 101 |
| ROOM_102 | Room 102 |
| ROOM_201 | Room 201 |
| ROOM_202 | Room 202 |
| ROOM_301 | Room 301 |
| ROOM_302 | Room 302 |
| SCIENCE_LAB_1 | Science Lab 1 |
| SCIENCE_LAB_2 | Science Lab 2 |

**Mobile card per exam:**

```
┌───────────────────────────────────────────────┐
│ Mon, 15 Dec 2025  09:00–11:00       [CBT]    │
│ CSC101 · Introduction to CS                   │
│ University ICT Centre                         │
│ 50 students · CBAS                            │
│ ─────────────────────────────────────────────  │
│ Dr. Smith, Prof. Jones            [···]       │
└───────────────────────────────────────────────┘
```

### 9.3 Schedule Exam Modal

**Width (desktop):** 560px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Course | `combobox` | Search by code or name. Shows code + name + level. Required. |
| Exam date | `date` | Date picker. Required. |
| Start time | `text` | HH:MM format. Required. |
| End time | `text` | HH:MM format. Must be after start. Required. |
| Venue | `select` | Grouped. See below. |
| Student count | `number` | Min 1. Required. |
| Target college | `select` | CBAS / CHMS. Only shown and required when selected course `isGeneral === true`. |
| Invigilators | `text` | Optional. |

**Venue select grouping:**

Group 1 — "ICT Venues (Required for CBT)": UNIVERSITY_ICT_CENTER, ICT_LAB_1, ICT_LAB_2, COMPUTER_LAB.

Group 2 — "Regular Venues": all others.

**CBT enforcement:** When the selected course is 100L or `isGeneral`, disable all Group 2 options with a `disabled` attribute. Show a blue info banner above the venue select: "This is a CBT course (100L or General). You must select an ICT venue."

When the selected course is not CBT, all options are enabled and no banner is shown.

---

## 10. Users — `/lecturers` and `/students`

These are two separate routes sharing one component with a `role` prop.

`/lecturers` → `getUsers({ role: 'LECTURER' })` (also shows HODs: `getUsers({ role: 'HOD' })`).
`/students` → `getUsers({ role: 'STUDENT' })`.

HODs see only users where `departmentCode === user.departmentCode` (apply this filter client-side or pass as `departmentCode` param).

### 10.1 Page Layout

**Page header row:**
- Left: "Lecturers" / "Students" heading.
- Right: "+ Add Lecturer" / "+ Add Student" (indigo, ADMIN only).

**Filter bar:** Search input | Department select (ADMIN only, HOD sees only their dept) | "Show inactive" checkbox.

**Users table / card list.**

### 10.2 Users Table

**Desktop columns:** Avatar+Name | Matric/Staff No. | Email | Department | Role badge | Last Login | Status | Actions.

**Avatar:** 32px circle, initials-based, background color deterministic from name hash.

**Last Login:** Relative time ("3 days ago", "Never").

**Status:** "Active" green pill / "Inactive" gray pill.

**Actions (ADMIN only):** Edit (Pencil, 44×44px) | Toggle active (Power icon, 44×44px) | Delete (Trash, red, 44×44px) with confirmation.

**Mobile card per user:**

```
┌───────────────────────────────────────────────┐
│ [AT]  Dr. Alan Turing               [ADMIN]   │
│       STAFF001                               │
│       turing@courseflow.edu                  │
│       Computer Science · Active              │
│ ─────────────────────────────────────────────  │
│ Last login: 3 days ago            [···]      │
└───────────────────────────────────────────────┘
```

### 10.3 Add/Edit User Modal

**Width (desktop):** 520px.

**Fields:**
| Field | Type | Create | Edit |
|-------|------|--------|------|
| Full name | `text` | Optional | Optional |
| Matric / Staff no. | `text` | Required | Required |
| Email | `email` | Required | Required |
| Password | `password` | Required | Not shown |
| Role | `select` | Optional (default Student) | Optional |
| Department | `select` | Conditional | Conditional |
| Phone | `text` | Optional | Optional |

On create: `apiClient.createUser(data)`. On edit: `apiClient.updateUser(id, data)`.

---

## 11. Complaints — `/complaints`

### 11.1 Role Behaviour

- **STUDENT:** Sees only their own complaints. Can create. Cannot see others.
- **ADMIN/HOD:** Sees all. Full management controls.

### 11.2 ADMIN/HOD Page Layout

**Page header row:** "Complaints" heading. Right: no create button (admin does not file complaints).

**Status tab bar (below header, margin-top 16px):**

Horizontally scrollable on mobile. Five tabs: All | Pending | In Progress | Resolved | Closed.

"Pending" tab shows a count badge (amber pill with number). Tab bar styled as a segmented underline navigation: active tab has an indigo bottom border + indigo text, inactive tabs are gray.

Tab click behaviour:
- "All" → `apiClient.getComplaints()`
- "Pending" → `apiClient.getPendingComplaints()`
- "Resolved" → `apiClient.getResolvedComplaints()`
- "In Progress" / "Closed" → `apiClient.getComplaints()` then filter client-side by status.

**Filter bar (below tabs):** Search by subject or name | Order by: Newest / Oldest.

**Complaints table / cards.**

### 11.3 Complaints Table

**Desktop columns:** # | Name | Email | Department | Subject | Status | Submitted | Actions.

**Status badges:** PENDING → amber, IN_PROGRESS → blue, RESOLVED → green, CLOSED → gray.

**Subject:** Truncated to 40 chars. Full text in tooltip on hover.

**Actions:** Eye icon (view detail) | Status select (inline dropdown directly in the row, updates on change).

**Mobile card per complaint:**

```
┌───────────────────────────────────────────────┐
│ Course Registration Issue       [PENDING]     │
│ James Student · Computer Science              │
│ Submitted 2 days ago                          │
│ I am experiencing issues with my academic...  │
│ ─────────────────────────────────────────────  │
│                                   [···]       │
└───────────────────────────────────────────────┘
```

### 11.4 Complaint Detail Modal

**Width (desktop):** 560px.

**Header:** Subject line (18px semibold). Status badge. Close button.

**Body (vertical stack, gap 16px):**
- Name, Email, Department (key-value row).
- Submitted date (key-value).
- Message (full text, white-space: pre-wrap, scrollable container max-height 200px, border, rounded-lg, padding 12px).
- If resolved: "Resolved by {resolvedBy} on {resolvedAt}" (gray text).

**Footer (ADMIN only):** Status select (full width, height 44px): PENDING | IN_PROGRESS | RESOLVED | CLOSED. Changing fires `apiClient.updateComplaintStatus(id, status)` immediately.

### 11.5 Student Page Layout

**Page header:** "My Complaints" heading. Right: "+ Submit Complaint" (indigo).

**Content:** Vertical list of complaint cards. Each card shows: subject (bold), department, status badge, submitted date, message preview (2 lines).

If no complaints: empty state "You haven't submitted any complaints." + "+ Submit Complaint" button.

### 11.6 Submit Complaint Modal

**Width (desktop):** 520px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Full name | `text` | Pre-filled from `user.name`. Required. |
| Email | `email` | Pre-filled from `user.email`. Read-only. |
| Department | `text` | Free text. Required. |
| Subject | `text` | 5–200 chars. Required. |
| Message | `textarea` | 10–1000 chars. Rows 5. Character counter shown below. Required. |

On submit: `apiClient.createComplaint(data)`. On success: close modal, re-fetch list, toast "Your complaint has been submitted."

---

## 12. Verification Codes — `/verification-codes` (ADMIN only)

### 12.1 Page Layout

**Page header:** "Verification Codes" heading. Right: "+ New Code" (indigo).

**Table / cards below.**

### 12.2 Table

**Desktop columns:** Code | Role | Description | Usage | Expires | Status | Created By | Actions.

**Code column:** Monospace font. Copy icon (Clipboard, 16px) to the right of the code. Clicking copies to clipboard and shows a "Copied!" tooltip (disappears after 2 seconds). The icon is a 44×44px touch target.

**Usage column:** If `maxUsage` is set, render a horizontal progress bar (width 80px, indigo fill, gray-200 track) + "{usageCount}/{maxUsage}" label. If `maxUsage` is null, show "Unlimited" in gray.

**Expires column:** Formatted date ("31 Dec 2025") or "Never".

**Status badge:** "Active" → green. "Inactive" → gray.

**Actions (44×44px each):** Edit (Pencil) | Toggle active (Power icon — green if active, gray if inactive) | Delete (Trash, red, with confirmation).

**Mobile card per code:**

```
┌───────────────────────────────────────────────┐
│ LECTURER-2025 [Copy]              [LECTURER]  │
│ General lecturer code                         │
│ Usage: ████░░░░ 4/10  ·  Expires: 31 Dec 2025│
│ ─────────────────────────────────────────────  │
│ [Active]                          [···]       │
└───────────────────────────────────────────────┘
```

### 12.3 Create/Edit Verification Code Modal

**Width (desktop):** 500px.

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Code | `text` | Max 50 chars. Required. Right-aligned "Generate" button fills a random 12-char alphanumeric code. |
| Role | `select` | ADMIN, HOD, LECTURER. Required. |
| Description | `text` | Max 200 chars. Optional. |
| Max usage | `number` | Min 1. Leave empty for unlimited. |
| Expiry date/time | `datetime-local` | Optional. |

**"Generate" button:** Positioned inside the Code input field on the right (like a show/hide password toggle). Generates a string in format `ROLE-YEAR-XXXXXX` where XXXXXX is random alphanumeric.

---

## 13. Profile Page — `/profile`

**Layout:** Centered, max-width 640px, margin 0 auto, padding 24px.

**Section 1 — Identity card (white, rounded-xl, border, padding 24px):**
Large avatar circle (64px), name (22px bold) below, role badge, email (14px gray-500).

**Section 2 — Personal Information (white card, margin-top 16px):**
Form with Name and Phone fields. Email is read-only (shown as static text with a lock icon and tooltip "Email cannot be changed here."). "Save Changes" button (indigo, right-aligned, height 40px).

On submit: `apiClient.updateUser(user.id, { name, phone })`.

**Section 3 — Password Reset (white card, margin-top 16px):**
Title "Change Password". Description "We'll send a reset link to your email address." Single "Send Reset Link" button (outline, full width on mobile). Clicking calls `apiClient.forgotPassword(user.email)` silently, then shows a success message inline: "A password reset link has been sent to {user.email}."

**Section 4 — Account Details (white card, margin-top 16px, read-only):**
Key-value: Department, Matric/Staff Number, Account created date, Last login.

---

## 14. Toast Notifications

**Position:** Top-right corner, fixed, `z-index: 9999`, margin 16px from right and top edges.

**Mobile position:** Top-center, full width minus 32px margin on each side.

**Toast card:** White background, rounded-xl, shadow-lg, border-left 4px solid (color by type), padding 12px 16px, min-width 300px (desktop), max-width 90vw (mobile). Flex row: type icon (20px, left) + message text (14px, flex-grow) + dismiss × button (right, 44×44px touch target).

**Types and auto-dismiss:**

| Type | Border color | Icon | Auto-dismiss |
|------|-------------|------|-------------|
| Success | green-500 | CheckCircle | 4 seconds |
| Error | red-500 | XCircle | 6 seconds |
| Info | blue-500 | Info | 4 seconds |
| Warning | amber-500 | AlertTriangle | 5 seconds |

**Stacking:** Multiple toasts stack vertically with 8px gap. Maximum 3 visible at once. Oldest is dismissed first when a 4th arrives.

**Animation:** Slides in from right (desktop) or from top (mobile), 200ms ease-out. Fades out on dismiss, 150ms.

**Standard messages:**

| Action | Type | Message |
|--------|------|---------|
| Department created | Success | "Department created successfully." |
| Department updated | Success | "Department updated." |
| Department deleted | Success | "Department deleted." |
| Schedule locked | Success | "Schedule locked for {dept name}." |
| Schedule unlocked | Success | "Schedule unlocked for {dept name}." |
| Schedules generated | Success | "{X} courses scheduled for {semester} semester." |
| Course created | Success | "Course {code} created." |
| Course updated | Success | "Course {code} updated." |
| Schedule created | Success | "Schedule created." |
| Exam scheduled | Success | "Exam scheduled for {courseCode}." |
| Session activated | Success | "{name} is now the active session." |
| Session archived | Info | "Session archived." |
| Complaint submitted | Success | "Your complaint has been submitted." |
| Status updated | Success | "Complaint status updated to {status}." |
| Copied to clipboard | Info | "Copied to clipboard." |
| Session expired | Warning | "Your session has expired. Please sign in again." |
| Network error | Error | "Network error. Please check your connection." |

---

## 15. Confirmation Dialogs

All destructive or irreversible actions require a confirmation dialog before the API call is made.

**Desktop:** Centered overlay modal, max-width 400px, same modal rules as §4.

**Mobile:** Bottom sheet (same rules as §4).

**Structure:**
```
[Icon — 40px, centered]
Title (18px semibold, centered)
Body text (14px gray-500, centered)

[Cancel button — full width on mobile, gray outline]
[Confirm button — full width on mobile, colored]
```

**Icon and confirm button color by action type:**

| Action | Icon | Confirm color |
|--------|------|--------------|
| Delete | Trash2, red-500 | Red |
| Archive session | Archive, amber-500 | Amber |
| Generate schedules | RefreshCw, indigo-500 | Indigo |
| Lock schedule | Lock, amber-500 | Amber |
| Unlock schedule | Unlock, green-500 | Green |
| Deactivate user | UserX, red-500 | Red |

**Body text examples:**
- Delete department: "This will permanently deactivate {name}. Courses in this department will not be deleted but the department will no longer appear in listings."
- Generate schedules: "This will delete all auto-generated schedules for the selected scope and regenerate them. Manual overrides and fixed slots will be preserved."

---

## 16. Empty States

Every list, table, and grid must have a designed empty state.

**Structure:** Centered in the content area vertically and horizontally. Icon (64px, gray-300), title (16px semibold, gray-700, margin-top 16px), subtitle (14px gray-400, margin-top 8px), optional CTA button (margin-top 20px).

| Page | Icon | Title | Subtitle | CTA |
|------|------|-------|----------|-----|
| Departments | Building2 | "No departments yet" | "Add your first department to get started." | "+ New Department" (ADMIN) |
| Courses | BookOpen | "No courses found" | "Try adjusting your filters or add a new course." | "+ New Course" (ADMIN/HOD) |
| Schedules | Clock | "No schedules this semester" | "Generate schedules or add them manually." | "Generate Schedules" (ADMIN/HOD) |
| Exams | ClipboardList | "No exams scheduled" | "Schedule exams for the active session." | "+ Schedule Exam" (ADMIN) |
| Complaints (admin) | MessageSquareWarning | "No complaints" | "No complaints match the current filter." | — |
| Complaints (student) | MessageSquare | "No complaints submitted" | "Submit a complaint if you need assistance." | "+ Submit Complaint" |
| Verification codes | KeyRound | "No verification codes" | "Create codes to allow staff registration." | "+ New Code" |
| Users | Users | "No users found" | "Try adjusting your filters." | — |

---

## 17. Pagination

**Desktop pagination controls (below every paginated list/table):**

Flex row, space-between, padding-top 16px, border-top `1px solid #F3F4F6`.

Left: "Showing 1–10 of 47 results" (14px gray-500).

Center: Page buttons — previous arrow (ChevronLeft, 44×44px) | up to 5 page number buttons (each 44×44px, active page: indigo background white text, rounded-lg) | ellipsis where needed | next arrow (ChevronRight, 44×44px).

Right: Per-page select: 10 / 25 / 50 (width 80px). Changing resets to page 1 and re-fetches.

**Mobile pagination controls:**

Simple three-part row, full width:
```
[< Prev — 44px]    Page 2 of 5    [Next > — 44px]
```

Left/right buttons are full-text ("Previous" / "Next") not icon-only, minimum 44px height. "Page X of Y" centered, 14px gray-500.

The per-page select moves inside the Filter bottom sheet on mobile.

---

## 18. Loading States

### 18.1 Page Skeletons

While primary page data is loading, show a skeleton layout that mirrors the shape of the real content.

- **Tables:** 6–8 skeleton rows. Each row has gray-200 blocks matching approximate column widths, animated with `animate-pulse`.
- **Card grids:** 6 skeleton cards at the same dimensions as real cards.
- **Stat cards:** 4 skeleton stat cards (icon placeholder circle + two block lines).
- **Timetable:** Skeleton grid with random-width gray-200 blocks scattered across cells.

### 18.2 Button and Form Loading

When a form is submitting:
- Replace button label with a centered spinner (white, 16px).
- Disable the button.
- Disable all form inputs.
- Apply `opacity: 0.6` to the entire form.

### 18.3 Page Transition Progress Bar

On every route change, show a slim 3px progress bar at the very top of the viewport, above the topbar, `z-index: 100`. Indigo color. Enters at 0% width, progresses to ~70% quickly, then completes to 100% when the new page's data finishes loading, then fades out.

### 18.4 Inline Refetch Indicators

When re-fetching data after a filter change or after a mutation (not a full page load), show a small spinning indicator in the top-right corner of the content card/table rather than replacing the entire content with a skeleton. This prevents layout shift.

---

## 19. Error Handling

### 19.1 Inline Form Errors

Each field that fails validation shows a small red message (12px, red-600) immediately below it. Validation triggers on `blur` for each field individually. On submit, all fields validate simultaneously.

Server-side validation errors in `response.error` (which may be a comma-separated list from the backend's class-validator) are parsed, split by comma, and displayed as an error banner above the submit button:

```
[AlertCircle — red, 16px]  "name should not be empty, code must be 2-4 uppercase letters"
```

### 19.2 Page-Level Fetch Errors

If the main data fetch fails, replace the content area (not the page header) with:

```
[AlertCircle — red, 48px, centered]
"Failed to load data"
"An error occurred while fetching {entity}. Please try again."
[Retry button — outline, indigo]
```

The Retry button re-fires the same fetch call.

### 19.3 401 Interception

Wrap the global fetch logic. If any response returns `statusCode: 401`, immediately: call `apiClient.setToken(null)`, clear global auth state, redirect to `/login`, show a warning toast: "Your session has expired. Please sign in again."

### 19.4 403 Forbidden

Show an in-page amber banner at the top of the content area:

```
[Lock icon — amber] "You do not have permission to perform this action."
```

Do not redirect. Do not clear the token.

### 19.5 Network Errors

When `apiClient.request` returns `statusCode: 0` (network failure), show a persistent error toast (no auto-dismiss) with a "Retry" button that re-fires the last action.

---

## 20. Responsive Behaviour Summary

| Breakpoint | Key changes |
|-----------|-------------|
| < 640px | Sidebar as left drawer. Topbar: hamburger + logo + avatar only. All modals as bottom sheets. Filter bars collapsed behind "Filters" button. Tables as card stacks. Timetable as day-picker + vertical timeline. Pagination as Prev / Page X of Y / Next. Stat cards 2×2. |
| 640px–767px | Sidebar icon-only (48px). Modals as bottom sheets. Same card patterns. Timetable day-picker still. |
| 768px–1023px | Sidebar icon-only. Modals as centered overlays. Timetable shows full 5-column grid. Tables show reduced columns. |
| ≥ 1024px | Full sidebar (240px). All layouts as fully specified. |

---

## 21. Data Refresh Strategy

- After every successful mutation (create, update, delete), re-fetch the affected list. Do not use stale data.
- After Generate Schedules succeeds, fully re-fetch the schedules list and re-render the timetable.
- After activating or archiving a session, re-fetch `getActiveAcademicSession()` and update the session badge in the Schedules page header and Dashboard simultaneously.
- After locking or unlocking a department, re-fetch the department card in the departments list and update the HOD dashboard stat card.
- Use optimistic updates only for toggle actions (active/inactive status, lock/unlock) — revert to previous state if the request fails and show an error toast.

---

## Health — `/health` (ADMIN only)

### Page Layout

**Page header row:**
- Left: "System Health" heading.
- Right: "Refresh" button (outline, RefreshCw icon, height 40px). Clicking re-fetches all health data. A "Last checked: X seconds ago" label sits to the left of the button, gray-500, 13px. This counter increments every second using a client-side interval.

**Auto-refresh:** The page re-fetches all health data every **30 seconds** automatically while the page is mounted. The interval resets when the user manually clicks "Refresh."

**Content layout (margin-top 24px):**
- Desktop: Two rows. First row: 3 stat cards side by side. Second row: detailed panels.
- Mobile: All stacked vertically, gap 12px.

---

### Overall Status Banner

Sits above the stat cards. Full-width card, rounded-xl, border, padding 16px 20px.

**When all systems up:**
```
[CheckCircle — green, 24px]  "All systems operational"  [green-50 background, green-700 border-left 4px]
```

**When any system down:**
```
[AlertCircle — red, 24px]  "System degraded — one or more checks failed"  [red-50 background, red-500 border-left 4px]
```

This banner is derived from the response of `apiClient.healthCheck()`. If `response.success === false` or `info.database.status !== 'up'` or either memory check is `'down'`, the banner shows the degraded state.

---

### Stat Cards Row (3 cards)

Fetched from `apiClient.simpleHealthCheck()` and `apiClient.healthCheck()` in parallel on mount.

**Card 1 — Application Status**
- Icon: Server (sky background circle).
- Value: "Online" (green) or "Offline" (red).
- Label: "Application".
- Sub-line: Environment badge ("production" → indigo pill, "development" → amber pill) + version string ("v1.0.0").
- Data source: `simpleHealthCheck().data.environment` and `.version`.

**Card 2 — Database Status**
- Icon: Database (violet background circle).
- Value: "Connected" (green) or "Disconnected" (red).
- Label: "Database".
- Sub-line: Response time in milliseconds ("45ms"). Fetched from `apiClient.databaseHealthCheck()`.
- Data source: `databaseHealthCheck().data.database.connected` and `.responseTime`.

**Card 3 — Uptime**
- Icon: Clock (emerald background circle).
- Value: Formatted uptime — convert `simpleHealthCheck().data.uptime` (seconds) to "Xd Xh Xm" format.
- Label: "Uptime".
- Sub-line: "Since {calculated start datetime}".

---

### Detailed Panels (below stat cards)

**Desktop:** Two panels side by side, equal width.
**Mobile:** Stacked.

---

**Panel 1 — Memory Usage**

White card, rounded-xl, border, padding 20px. Title: "Memory Usage" (16px semibold).

Fetched from `apiClient.healthCheck().data.info`.

Two rows inside:

*Heap Memory:*
- Label: "Heap Memory".
- Progress bar: width proportional to `heapUsed / limit`. Color: green if < 70%, amber if 70–90%, red if > 90%.
- Values: "{used MB} / {limit MB}" (13px, gray-500, right-aligned).
- Status badge: "Healthy" (green) or "Warning" (amber) or "Critical" (red).

*RSS Memory:*
- Same structure as heap.

Both `used` and `limit` values are in bytes from the API — convert to MB for display: `Math.round(bytes / 1024 / 1024)`.

---

**Panel 2 — Database Tables**

White card, rounded-xl, border, padding 20px. Title: "Database Records" (16px semibold).

Fetched from `apiClient.databaseHealthCheck().data.database.tables`.

Vertical list of 4 items, each: icon + label (left) + count (right, bold).

| Icon | Label | Data key |
|------|-------|---------|
| Building2 | Departments | `tables.departments` |
| BookOpen | Courses | `tables.courses` |
| Clock | Schedules | `tables.schedules` |
| Users | Users | `tables.users` |

Each count has a subtle right-aligned gray-200 background pill.

---

**Panel 3 — Readiness and Liveness (full width, below the two panels)**

White card, rounded-xl, border, padding 20px. Title: "Probe Status" (16px semibold).

Horizontal flex row (desktop), vertical stack (mobile), gap 16px.

Fetched from `apiClient.readinessCheck()` and `apiClient.livenessCheck()` in parallel.

*Readiness probe:*
- Label: "Readiness".
- Status: "Ready" (green badge) or "Not Ready" (red badge).
- Sub-label: "Application is ready to serve traffic."
- Data: `readinessCheck().data.status === 'ready'`.

*Liveness probe:*
- Label: "Liveness".
- Status: "Alive" (green badge) or "Dead" (red badge).
- Sub-label: "Application process is running."
- Timestamp: `livenessCheck().data.timestamp` formatted as "03 Mar 2026, 14:32:01".
- Data: `livenessCheck().data.status === 'alive'`.

---

### Error States on Health Page

If `healthCheck()` returns `statusCode: 503` (database down), render the database stat card in full red: red-50 background, red-500 border-left, "Disconnected" value, and show the error message from `response.error.database.message` as a small text below the card value.

If any individual fetch fails (network error), show a small inline error label inside the affected card: "Failed to fetch — Retry" link. Clicking the link re-fetches only that specific endpoint.


---

## 22. Complete API → UI Mapping Reference

| API Method | Triggered by |
|-----------|-------------|
| `login` | Login form submit |
| `register` | Register form submit |
| `getCurrentUser` | App initialization, profile page mount |
| `forgotPassword` | Forgot password form submit, profile password reset button |
| `resetPassword` | Reset password form submit |
| `getVerificationCodes` | Verification codes page mount |
| `getVerificationCodeById` | Edit code modal open |
| `createVerificationCode` | Create code modal submit |
| `updateVerificationCode` | Edit code modal submit, toggle active/inactive |
| `deleteVerificationCode` | Delete confirmation confirm |
| `getUsers` | Lecturers/Students page mount and filter changes, HOD/Lecturer comboboxes in course and department modals |
| `getUserById` | User detail view |
| `createUser` | Add user modal submit |
| `updateUser` | Edit user modal submit, profile save changes |
| `deleteUser` | Delete user confirmation |
| `getLecturerDashboard` | HOD and Lecturer dashboard mount |
| `getLecturerCourses` | Lecturer self-service courses tab |
| `getLecturerSchedule` | Lecturer/HOD dashboard schedule section, lecturer schedule tab |
| `getDepartments` | Departments page mount, all department select dropdowns throughout the app |
| `getDepartmentByCode` | Department detail page mount, HOD dashboard |
| `getDepartmentFullDetails` | Department detail page full section |
| `getDepartmentStatistics` | Admin dashboard mount |
| `createDepartment` | Create department modal submit |
| `updateDepartment` | Edit department modal submit |
| `deleteDepartment` | Delete department confirmation |
| `lockDepartmentSchedule` | Lock schedule action (menu item or HOD dashboard toggle) |
| `unlockDepartmentSchedule` | Unlock schedule action |
| `getDepartmentsBulkTemplate` | "Download Template" button on departments page |
| `uploadDepartmentsBulk` | Bulk upload modal submit on departments page |
| `getCourses` | Courses page mount and filter changes, course comboboxes in schedule and exam modals |
| `getCourseByCode` | Course detail sheet open |
| `getCoursesWithoutSchedules` | Admin dashboard quick stats |
| `getCourseStatistics` | Admin dashboard mount |
| `createCourse` | Create course modal submit |
| `updateCourse` | Edit course modal submit |
| `deleteCourse` | Delete course confirmation |
| `getCoursesBulkTemplate` | "Download Template" button on courses page |
| `uploadCoursesBulk` | Bulk upload modal submit on courses page |
| `getSchedules` | Schedules page mount and filter changes, student and lecturer dashboard schedule section |
| `getScheduleById` | Schedule detail sheet open |
| `getScheduleStatistics` | Admin dashboard mount, schedules page stats |
| `createSchedule` | Create schedule modal submit |
| `updateSchedule` | Edit schedule modal submit |
| `deleteSchedule` | Delete schedule confirmation |
| `generateSchedules` | Generate schedules modal submit |
| `getAcademicSessions` | Sessions page mount, session select dropdowns on schedules and exams pages |
| `getAcademicSessionById` | Session edit modal open |
| `getActiveAcademicSession` | Dashboard mount, schedules page header badge |
| `getSessionStatistics` | Session statistics modal open |
| `createAcademicSession` | Create session modal submit |
| `updateAcademicSession` | Edit session modal submit |
| `activateAcademicSession` | "Activate" button on session card |
| `archiveAcademicSession` | "Archive" button confirmation |
| `deleteAcademicSession` | Delete session confirmation |
| `getExams` | Exams page mount and filter changes, student dashboard upcoming exams |
| `getExamById` | Exam detail view |
| `createExam` | Schedule exam modal submit |
| `updateExam` | Edit exam modal submit |
| `deleteExam` | Delete exam confirmation |
| `getComplaints` | Admin complaints page mount, "All" and "In Progress" / "Closed" tab clicks |
| `getMyComplaints` | Student complaints page mount |
| `getPendingComplaints` | "Pending" tab click |
| `getResolvedComplaints` | "Resolved" tab click |
| `createComplaint` | Submit complaint modal submit |
| `updateComplaintStatus` | Status select change in table row or complaint detail modal |
| `healthCheck` | Health page mount, auto-refresh interval, manual Refresh button |
| `simpleHealthCheck` | Health page mount (application status card + uptime card) |
| `databaseHealthCheck` | Health page mount (database status card + tables panel) |
| `readinessCheck` | Health page mount (probe status panel) |
| `livenessCheck` | Health page mount (probe status panel) |