# BijliWatch — Smart Electricity Usage & Complaint Resolution Platform

A full-stack, enterprise-grade utility management and grievance resolution platform designed for electricity consumers, field engineers, district nodal officers, and state regulatory commissioners.

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **3D Digital Twin**: Three.js (r160+) with `RoomEnvironment`, procedural PBR materials, ACESFilmic tone mapping, and collapsible bottom dock.
- **Backend**: Node.js, Express.js (mounted via Vite middleware in dev; standalone in production), TypeScript (`tsx`).
- **Database**: MongoDB Atlas using Mongoose with indexes, schema validation, and persistent fallback synchronizer.
- **Authentication**: JWT access tokens, `bcryptjs` password hashing, protected routes, and role-based access control (RBAC).
- **File Uploads**: Cloudinary REST API with local data-URI preview fallback, file type validation (JPG, PNG, WEBP, PDF), and 10MB size enforcement.
- **Maps**: Leaflet with OpenStreetMap tiles, GPS browser geolocation detection, and manual administrative jurisdiction selection.
- **Testing**: Vitest integration test suite.

---

## 2. Four User Roles & Administrative Tiers

| Tier / Role | Representative Demo Account | Jurisdiction Scope | Core Privileges |
|---|---|---|---|
| **Consumer (Citizen)** | `rajesh.consumer@bijliwatch.gov.in` | Personal connections | Register connections, log meter readings, upload bills, lodge complaints, track status, appeal/reopen. |
| **Local / Panchayat Admin** | `anil.panchayat@bijliwatch.gov.in` | Rampur Locality / Ward 4 | Assign work to lineworkers, update investigation notes, execute "Mark work as completed" resolution workflow. |
| **District Admin** | `priya.district@bijliwatch.gov.in` | Patna Electric Supply Circle | Supervise circle-wide queues, verify/approve resolution evidence to grant official closure, export CSV reports. |
| **State Admin** | `vikram.state@bijliwatch.gov.in` | Bihar State (Statewide) | Statewide analytics, configure gazetted tariff slab rates, inspect immutable cryptographically logged audit trails. |

*Default password for all pre-provisioned demo accounts:* `DemoPassword123!` (or use the one-click top bar Role Switcher).

---

## 3. Explicit Complaint Status Lifecycle

```
[Submitted] ──▶ [Under Review] ──▶ [Assigned] ──▶ [In Progress]
                                                        │
                                                        ▼ (Checkbox: "Mark work as completed")
[Resolved] ◀── [Approved / Verified] ◀── [Resolution Submitted]
     │
     └──▶ [Reopened / Appealed by Consumer]
```

### The "Mark Work as Completed" Rule:
Clicking the checkbox does not directly set a complaint to `Resolved`. Instead, it exposes mandatory fields:
1. Work performed / solution description
2. Actual completion date
3. Resolution notes
4. Photographic work evidence
5. Officer confirmation

Upon server-side validation, the status transitions to **`Resolution Submitted`**. Only authorized District/State administration can verify the photographic proof and grant formal **`Resolved`** status.

---

## 4. Explainable Electricity Anomaly Detection

BijliWatch evaluates meter recordings against historical rolling averages:
$$\text{Delta} = \frac{\text{Current Units} - \text{Baseline Units}}{\text{Baseline Units}} \times 100$$
- If Delta $> 60\%$, an Anomaly Alert is generated.
- The engine explains the calculation without making speculative accusations (e.g., highlighting neutral leakage, ambient cooling/heating, or meter register pulse drift).
- Clear ethical disclosure is attached: *An elevated reading does not prove meter tampering without physical laboratory verification.*

---

## 5. Local Setup & Execution

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd bijliwatch

# Install dependencies
npm install

# Start full-stack development server (Express + Vite on Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Run Automated Tests
```bash
npm run test
```

---

## 6. Environment Variables (`.env`)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configurable variables:
- `MONGODB_URI`: MongoDB Atlas connection URI (`mongodb+srv://...`). When omitted or invalid, BijliWatch operates seamlessly in embedded persistent mode.
- `JWT_SECRET`: Secret key for signing JSON Web Tokens.
- `PORT`: Web server port (defaults to `3000`).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Optional Cloudinary credentials for cloud media storage.

---

## 7. Security Highlights

- **Anti-Self-Elevation**: Public signup endpoints strictly enforce the `consumer` role; administrator accounts must be provisioned through authorized nodal processes.
- **Jurisdiction Sandboxing**: Endpoints filter records strictly by the requesting officer's assigned state, district, and locality.
- **Immutable Audit Trail**: All status transitions, assignments, and resolution reviews are cryptographically timestamped in the audit log.
