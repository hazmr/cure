# CURE Healthcare Next.js Client — Implementation Plan

This document outlines the architecture, design system, and execution steps for building a premium Next.js client application for the **CURE Healthcare** NestJS server. The client will be built using Next.js 14+ (App Router), Tailwind CSS, and custom premium components matching the shadcn/ui design style, complete with a dark/light mode toggle matching your requested colors.

---

## Technical Design & Color Palette

The client will feature a responsive, stunning glassmorphism-inspired design utilizing custom theme variables.

### Color Specifications
We will map your exact requested hex colors in `src/app/globals.css`:
- **Light Theme** (`:root`):
  - `--background`: `#F8F7F4` (Warm beige-white)
  - `--foreground`: `#2C2C2A` (Sleek off-black charcoal)
  - `--primary`: `#534AB7` (Royal indigo accent)
  - `--accent`: `#534AB7`
- **Dark Theme** (`.dark` / `[data-theme="dark"]`):
  - `--background`: `#1A1A1A` (Deep charcoal grey)
  - `--foreground`: `#F1EFE8` (Warm soft white)
  - `--primary`: `#7F77DD` (Bright pastel violet accent)
  - `--accent`: `#7F77DD`

### CORS & Next.js Rewrite Proxy
To bypass backend CORS restriction (`CORS_ORIGIN: "http://localhost:3000"` in Docker) without editing or restarting the active Docker container, we will configure a Next.js rewrite rule in `next.config.js`. 
Any frontend requests made to `http://localhost:3001/api/:path*` will be seamlessly proxied to the backend at `http://localhost:3000/:path*` server-side, eliminating browser-level CORS blocking.

---

## Proposed Changes

We will create a new Next.js client project in the directory `client/`.

### 1. Framework Scaffolding
- Initialize Next.js in `client/` using:
  ```bash
  npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
  ```
- Install client-side packages:
  - `lucide-react` for premium scalable vector icons.
  - `recharts` for beautiful Admin analytical visualizations.
  - `sonner` for smooth glassmorphic toaster feedback.

### 2. File Architecture inside `client/src`

#### `[NEW]` [next.config.js](file:///home/hazem/Projects/cure/client/next.config.js)
Define the server rewrites proxying `/api/:path*` to `http://localhost:3000/:path*`.

#### `[NEW]` [globals.css](file:///home/hazem/Projects/cure/client/src/app/globals.css)
Inject the custom theme tokens under `:root` and `.dark` structures and bind them to custom Tailwind utilities.

#### `[NEW]` [AuthProvider.tsx](file:///home/hazem/Projects/cure/client/src/components/AuthProvider.tsx)
Build a React Context Auth provider that manages:
- Client-side token storage (access token in memory, refresh token stored securely).
- Silent refresh cycle (polling or intercepting expired 401s to request a new token via `POST /api/auth/refresh`).
- Dynamic user profile state fetched via `GET /api/auth/me`.

#### `[NEW]` [landing-page](file:///home/hazem/Projects/cure/client/src/app/page.tsx)
Create a gorgeous landing page featuring:
- Glassmorphic header with a Theme Switcher (light/dark mode toggle) and dynamic Login/Dashboard buttons.
- A premium hero section with high-quality gradients, descriptive taglines, and smooth button hover micro-animations.
- Highlighting CURE features: Clinical Data Engine, Scheduling Booking slots, and Audit ledger.

#### `[NEW]` [auth-forms](file:///home/hazem/Projects/cure/client/src/app/login/page.tsx) & [register](file:///home/hazem/Projects/cure/client/src/app/register/page.tsx)
Build custom validation forms matching the DTO constraints:
- **Registration**: Handles `firstName`, `lastName`, `email`, and `password` (minimum 10 characters).
- **Login**: Handles `email` and `password`. Includes elegant error toast alerts upon failed credentials.

#### `[NEW]` [patient-dashboard](file:///home/hazem/Projects/cure/client/src/app/dashboard/patient/page.tsx)
Provide the Patient experience:
- **My Profile & Medical Records**: Displays the patient's personal detail card, blood type, and emergency contacts.
- **Diagnostic Timeline**: Shows a visual chronological card list of their `MedicalHistory` (severity, resolve status, date, notes).
- **Clinical Notes**: Displays chronological progress reports written by their assigned nurses.
- **Appointment Scheduler**: Real-time slot booking form using inputs like service type, date, location, city, and notes.
- **My Appointments Grid**: Tabular view of scheduled bookings showing status badges (`requested` 🟡, `confirmed` 🔵, `in_progress` 🟣, `completed` 🟢, `cancelled` 🔴). Contains inline Cancel actions (calls `DELETE /api/bookings/:id`).

#### `[NEW]` [nurse-dashboard](file:///home/hazem/Projects/cure/client/src/app/dashboard/nurse/page.tsx)
Provide the Nurse experience:
- **Assigned Bookings Queue**: Grid displaying active patient bookings assigned to the nurse. Includes quick-actions to step through the state machine: Confirm, Start Visit, and Mark Completed.
- **Patient Directory Search**: Interactive lookup showing all patient names. Selecting a patient opens a comprehensive modal summarizing their history.
- **Add Clinical Records**: Interface to instantly add a new Diagnostic entry (`low`, `medium`, `high`, `critical`) or log a new Clinical Note (`general`, `progress`, `medication`, `discharge`).

#### `[NEW]` [admin-dashboard](file:///home/hazem/Projects/cure/client/src/app/dashboard/admin/page.tsx)
Provide the Admin command console:
- **Metrics Deck**: Numerical summaries of total bookings, active cases, assigned nurses, and system events.
- **Operations Analytics**: Visual charts showing:
  1. Bookings by City (showing geographic demands).
  2. Appointment Status Distribution (interactive pie chart).
- **Patient Profiles Manager**: Fully detailed tabular editor allowing admins to register new patients, edit addresses/emergency info, or soft-delete patient accounts.
- **Network Schedule Coordinator**: Direct nurse assignments to booking requests, letting admins pick nurses for `requested` bookings.
- **Audit Logs Ledger**: Standardized table with real-time filters (by entity, action, date) displaying the immutable audit trail from `/api/audit-logs` (showing User IDs, actions like `CREATE`/`UPDATE`, and values changed).

---

## Verification Plan

### Automated Verification
Once developed, we will run:
```bash
npm run build
```
inside the `client/` folder to ensure clean TypeScript typing compiles and all code is syntax-valid.

### Manual Verification
1. **Theme Switch Verification**: Test light/dark mode changes on the navbar to verify CSS colors swap seamlessly.
2. **Auth Integration**:
   - Register a new patient account (tests `POST /auth/register` and ensures default `patient` role assignment).
   - Log in as the newly registered patient to check Dashboard access.
   - Log in as the system administrator (`admin@cure.local` / `ChangeMe123!`) to check Admin privileges.
3. **Clinical Records Flow**:
   - As Admin or Nurse, search for a patient and insert a medical history item and a clinical note.
   - Verify the patient can instantly view these updates when logging back into their dashboard.
4. **Booking Lifecycle & Conflict Prevention**:
   - As a patient, book an appointment slot.
   - As Admin, assign a nurse to the booking.
   - As the nurse, log in, view the assignment, and transition its state from `requested` -> `confirmed` -> `in_progress` -> `completed`.
   - Verify that all updates reflect correctly across dashboards and write clean audit logs to the Ledger.
