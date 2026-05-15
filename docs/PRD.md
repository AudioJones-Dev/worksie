# Worksie — Product Requirements Document (PRD)

> Status: **draft v0.1**. This is the first written PRD. It captures
> intent inferred from the existing scaffold, `Worksie/README.md`, and
> the four agent prompts in `Worksie/prompts/`. Treat any item not yet
> in code as a target, not a guarantee.

---

## 1. Problem

Field-services operators (contractors, restoration crews, inspectors,
roofers, property-services teams) juggle several disconnected tools to
do one job:

- A camera roll for site photos.
- A CRM for leads and pipeline.
- A scheduler for crews.
- A separate invoicing tool.
- Email or chat for client updates.
- Manual PDF assembly for end-of-job reports.

The friction shows up at billing time and in customer trust: photos
get lost, reports are inconsistent, and follow-up sits in someone's
inbox.

## 2. Target user

Primary: small-to-mid field-services businesses (1–50 crew members)
that already use a camera-first tool like CompanyCam, but want CRM,
payments, and AI reporting in one place.

Secondary: solo operators graduating from a phone-only workflow.

## 3. Goals (what success looks like)

- One app from lead → site visit → documentation → report → invoice.
- Reports auto-assembled from on-site media, not hand-built.
- Customers can see live job progress without an extra portal.
- The product feels like one tool, not a stack of integrations.

## 4. Non-goals (for now)

- Enterprise multi-tenant features (SSO, custom roles beyond a small
  fixed set).
- Native mobile applications. The web app must work well on mobile
  browsers; native is out of scope for v1.
- Self-hosted deployments. Firebase Hosting is the only target.
- Marketplace of third-party plugins.

## 5. Feature surfaces

Each feature lists its **current state** vs. **v1 intent**. "Stub"
means a file exists but contains placeholder JSX.

### 5.1 Capture
- GPS-tagged photo + video capture (`MediaCapture.jsx`) — *stub*.
- Annotator on captured media (`Annotator.jsx`) — *stub*.
- Gallery viewer (`GalleryViewer.jsx`) — *stub*.
- LiDAR scan ingestion + floorplan auto-gen
  (`LiDARScanner.jsx`, `FloorplanAutoGen.jsx`, `3DPreview.jsx`) — *stub*.

### 5.2 Reports
- Auto-report builder (`AutoReportBuilder.jsx`) — *stub*.
- PDF exporter (`PDFExporter.jsx`) — *stub*.
- Reports page (`pages/Reports.jsx`) — *stub*.

### 5.3 CRM
- Lead form, pipeline view, project overview
  (`CRMLeadForm.jsx`, `PipelineView.jsx`, `ProjectOverview.jsx`) — *stub*.
- CRM page (`pages/CRM.jsx`) — *stub*.

### 5.4 Scheduling
- Calendar view (`CalendarView.jsx`) — *stub*.
- Task board (`TaskBoard.jsx`) — *stub*.
- Tasks page (`pages/Tasks.jsx`) — *stub*.

### 5.5 Communication
- Chat window (`ChatWindow.jsx`) — *stub*.
- Toast notifications (`ToastNotification.jsx`) — *stub*.
- Firebase Cloud Messaging push wiring — **partial** (`logic/firebase.js`
  requests a token; no server-side delivery yet).

### 5.6 Payments
- Invoice builder (`InvoiceBuilder.jsx`) — *stub*.
- Stripe SDK installed in `package.json`; no flow implemented.

### 5.7 Templates
- Template marketplace (`TemplateMarket.jsx`) — *stub*.
- Checklist builder (`ChecklistBuilder.jsx`) — *stub*.

### 5.8 Admin & Auth
- Login / signup (`LoginForm.jsx`, `SignupForm.jsx`) — *stub*.
- User profile, avatar upload (`UserProfile.jsx`, `AvatarUpload.jsx`) — *stub*.
- Role selector, admin home (`RoleSelector.jsx`, `AdminHome.jsx`) — *stub*.

### 5.9 Cross-cutting
- Firebase Remote Config drives `--primary-color` and the promo banner
  copy. **Implemented** in `logic/remoteConfig.js`.
- Support form (`SupportForm.jsx`) — *stub*.
- Analytics chart (`AnalyticsChart.jsx`) — *stub*.

## 6. Constraints

- Firebase is the chosen backend; do not introduce a competing BaaS.
- Tailwind is the only styling system; do not introduce a second one.
- Browser-first; no React Native fork.
- No real secrets in the repo. See `docs/SECURITY.md`.

## 7. Open questions

- License (MIT? proprietary?). Tracked in `docs/DECISIONS.md`.
- Whether Firestore is the system of record or only a cache for a
  separate backend. Currently no Firestore code exists despite README
  claims.
- Whether LiDAR scan ingestion is v1-scope or a follow-on.
- Pricing model and free-tier limits.

## 8. Glossary

- **Stub** — a file that exists in the scaffold but contains only
  placeholder JSX (typically 1–5 lines).
- **Surface** — a user-facing feature area (Capture, Reports, CRM, …).
- **Remote Config** — Firebase Remote Config, used here for runtime
  theming and feature flagging.
