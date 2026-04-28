# ERP Refine — UI Design Brief for Google Stitch

## Project Context

Enterprise Resource Planning (ERP) web application built with React + Ant Design v5 + Refine v4.
Covers 9 business domains: Procurement, Sales, Inventory, Manufacturing, Quality, Finance, Assets, HR, Master Data.
Supports desktop and mobile, with a built-in AI assistant sidebar.
Language: English + Simplified Chinese (i18n).

---

## Design Scope

Design the following 5 deliverables. Together they cover every repeating pattern in the app — anything else can be derived.

---

## 1. Login / Landing Page (Cover)

**Purpose**: First impression. User enters credentials or clicks a quick-login demo button.

**Elements to design**:
- Full-page centered card layout
- Product logo + application name ("ERP Refine")
- Email + password input fields
- Primary "Sign In" button
- Divider + "Quick Login" section with 3–4 role buttons (Admin, Purchaser, Warehouse, Finance)
- Language toggle (EN / 中文) in top-right corner
- Subtle background (gradient or illustration — no photos)
- Error state for failed login (inline alert below the form)

**Tone**: Professional, clean, enterprise-grade. Not playful.

---

## 2. Left Sidebar Navigation

**Purpose**: Primary navigation. Always visible on desktop; slides in on mobile.

**Elements to design**:
- App logo + name at top
- Collapse/expand toggle button
- Grouped menu sections, each with a section label:
  - Procurement (6–8 items)
  - Sales (5 items)
  - Inventory (7 items)
  - Manufacturing (3 items)
  - Quality (3 items)
  - Finance (7 items)
  - Assets (3 items)
  - HR (3 items)
  - Master Data (6 items)
  - System (6 items)
  - Audit (7 items)
- Each menu item: icon (16px) + label text
- Active item highlight state
- Collapsed state: icons only, tooltip on hover
- Scrollable if overflow

**Two states to show**: Expanded (240px wide) and Collapsed (56px wide).

---

## 3. Right AI Assistant Sidebar

**Purpose**: Contextual AI chat panel, resizable, can be toggled open/closed.

**Elements to design**:
- Panel header: "AI Assistant" title + close (×) button
- Resize handle on the left edge (drag to widen)
- Chat message list:
  - User message bubble (right-aligned, filled background)
  - AI message bubble (left-aligned, light background, supports Markdown rendering — headers, bullet lists, inline code, code blocks)
  - Timestamp below each message
- Input area at bottom:
  - Multi-line text input with placeholder "Ask anything…"
  - Send button (icon)
  - Character counter (optional)
- Loading state: animated typing indicator (three dots)
- Empty state: centered icon + prompt text "Ask me about your ERP data"

**Width range**: 260px (default) to 640px (expanded).

---

## 4. List Page — Standard Module Table View

**Purpose**: The most common page type. Shows a paginated, filterable table of business records (e.g., Purchase Orders, Sales Orders, Invoices).

**Elements to design**:
- Page header:
  - Breadcrumb (e.g., Procurement › Purchase Orders)
  - Page title (bold, larger font)
  - Primary action button ("+ Create")
- Filter bar (above table):
  - Search input (keyword search)
  - 2–3 dropdown filters (Status, Date Range, Supplier/Customer)
  - "Reset Filters" link
- Data table:
  - Column headers with sort indicators
  - Row data with these column types: text, number (right-aligned, formatted), status badge, date, action buttons
  - Status badge variants: 5 states — Draft (gray), Pending (blue), Approved (green), Rejected (red), Closed (dark gray)
  - Row hover state
  - Checkbox for bulk selection (left column)
  - Action column: "View" and "Edit" icon buttons
- Pagination bar (bottom): page size selector + prev/next + page indicator
- Empty state: centered illustration placeholder + "No records found" text

---

## 5. Detail / Edit Form Page

**Purpose**: Shows a single record in read or edit mode. Used for creating and editing business documents (e.g., a Purchase Order, Invoice, Work Order).

**Elements to design**:
- Page header:
  - Breadcrumb (e.g., Purchase Orders › PO-2024-0042)
  - Document title + document number
  - Status badge (same 5 variants as above)
  - Action buttons: "Edit" / "Save" / "Cancel" / "Submit for Approval" / "Delete"
- Info card (top section): 2-column grid of labeled fields:
  - Field label (small, muted)
  - Field value (normal weight)
  - Examples: Supplier, Order Date, Delivery Date, Currency, Total Amount, Notes
- Line items table (middle section):
  - Editable rows with: product name, quantity input, unit price input, discount %, subtotal (auto-calculated)
  - "+ Add Line" button at bottom of table
  - Row delete icon on the right
- Summary panel (bottom-right):
  - Subtotal, Tax, Discount, **Total** (emphasized)
- Attachments section:
  - Upload button + list of uploaded files (filename + size + delete icon)
- Approval / workflow history timeline (bottom):
  - Vertical timeline with steps: Submitted → Under Review → Approved
  - Each step: avatar/icon + role name + timestamp + optional comment

---

## Visual Style Guidance

| Token         | Preference                          |
|---------------|--------------------------------------|
| Primary color | Deep blue or indigo (enterprise)     |
| Surface       | White cards on a light gray (#F5F5F5) background |
| Border radius | 6–8px (subtle, not round)            |
| Font          | System sans-serif stack (no Google Fonts) |
| Density       | Medium — comfortable for data-heavy screens |
| Shadows       | Subtle (1–2px elevation, no heavy drop shadows) |
| Icons         | Outlined style (consistent with Ant Design) |

---

## What NOT to Design

- Individual form field components (handled by Ant Design)
- Mobile-specific breakpoints (just make desktop layouts responsive-friendly)
- Dashboard/analytics charts (not in scope for this round)
- Any popups, modals, or drawers beyond the AI sidebar

---

## Deliverable Format

One Figma file with 5 frames, one per section above.
Each frame: desktop viewport at 1440 × 900px.
Use auto-layout and components where possible for reusability.
