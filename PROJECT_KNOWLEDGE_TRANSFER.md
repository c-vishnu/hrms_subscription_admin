# HRMS Subscription Admin — Knowledge Transfer

## 1. Purpose of this document

This document is the source-of-truth handoff for recreating the current HRMS Subscription Admin prototype in another repository or with another AI coding model. It describes the product behavior, data model, UI structure, visual rules, persistence, and acceptance criteria.

The current implementation is a front-end prototype. It uses browser `localStorage`; it does not yet use a production database or authentication system.

## 2. Product summary

Build a clean SaaS administration interface for managing HRMS membership plans and the public pricing landing page.

An administrator must be able to:

- View membership plans in a compact table.
- Create, edit, delete, publish, and unpublish plans.
- assign a display order and hierarchy level to each plan.
- Set separate monthly and annual prices.
- Set a regular price and discounted price for both billing cycles.
- Set the number of employees included in the plan.
- Set separate monthly and annual prices for each additional employee.
- Mark exactly one plan as “Most popular,” or clear the selection.
- Assign modules independently for monthly and annual subscriptions.
- Enable or disable modules globally.
- Edit and preview a public HRMS landing page.
- Reorder, show, hide, and edit landing-page sections.

## 3. Technology stack

- TypeScript
- React 19
- Next.js-compatible App Router components
- Vinext + Vite
- Tailwind CSS 4 foundation with custom global CSS
- shadcn-style UI primitives
- Base UI / Radix-compatible controls
- Lucide React icons
- Sonner toast notifications
- Cloudflare/Vinext build target

Required runtime: Node.js `>=22.13.0`.

## 4. Local setup

From the project root:

```bash
npm install
npm run dev
```

The development URL is:

```text
http://localhost:5173/
```

Validation:

```bash
npm run build
```

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vinext development server on port 5173 |
| `npm run build` | Create a production build |
| `npm run start` | Run the built Cloudflare Worker locally |
| `npm run lint` | Run ESLint |

## 5. Important files

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Main subscription admin, plan state, module assignment, plan drawer, CRUD actions, and WebMCP tools |
| `app/landing-builder.tsx` | Landing-page builder, section editor, drag/reorder behavior, desktop/mobile preview, testimonials, and FAQs |
| `app/globals.css` | Entire visual system, responsive layout, tables, drawer, builder, and landing-page preview |
| `app/layout.tsx` | Root layout and page metadata |
| `components/ui/*` | Reusable button, input, tabs, switch, checkbox, dialog, and textarea primitives |
| `public/employees-ui.png` | Default landing-page hero product image |
| `public/attendance-ui.png` | Secondary product UI image |
| `public/hrms-video-poster.png` | Walkthrough/video poster |
| `vite.config.ts` | Vinext, Sites, and Cloudflare Vite configuration |
| `package.json` | Scripts and dependencies |

## 6. Application shell

The desktop layout uses a dark navy left sidebar and a light main workspace.

Sidebar behavior:

- Shows HRMS branding and navigation icons.
- Subscription is the active item.
- Can collapse to an icon-only rail.
- Collapsed state is persisted in `localStorage`.
- On small screens it becomes an overlay navigation panel.

The main page contains:

1. Top toolbar.
2. Page heading and search.
3. “Edit landing page” and “New plan” actions.
4. Four summary cards: total plans, published plans, active modules, and most popular plan.
5. Tabs for Plans & pricing, Module access, and Landing page.

## 7. Core data model

### Module

```ts
type Module = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  price: number;
};
```

`price` remains in the legacy type but is not displayed or edited in the Module access UI.

Seed modules:

- Employees
- Attendance
- Leave
- Documents
- Payroll
- Recruitment
- Tasks
- Performance
- Helpdesk
- Connect
- LMS
- Compliance

Categories include Core HR, Operations, Collaboration, and Learning.

### Plan

```ts
type Plan = {
  id: string;
  name: string;
  description: string;
  order: number;
  level: number;
  monthlyPrice: number;
  monthlyDiscountedPrice: number;
  annualPrice: number;
  annualDiscountedPrice: number;
  includedEmployees: number;
  monthlyExtraPrice: number;
  annualExtraPrice: number;
  active: boolean;
  recommended: boolean;
  modules: string[];
  annualModules: string[];
};
```

Important semantics:

- `order` controls table/storefront sorting.
- `level` represents the upgrade hierarchy.
- `modules` contains module IDs for monthly billing.
- `annualModules` contains module IDs for annual billing.
- `active` means published.
- Only one plan should normally have `recommended: true`.
- A discounted price is shown only when it is greater than zero and lower than its regular price.

Seed plans:

1. Essential — order 1, level 1.
2. Professional — order 2, level 2, initially most popular.
3. Enterprise — order 3, level 3.

Plans are sorted by `order`, then by `level` as a tie-breaker.

## 8. Plans & pricing tab

The header contains a Monthly/Annual segmented selector. Changing it updates the price and additional-employee values displayed in the table; it does not modify data.

The table column order must be exactly:

1. Plan
2. Basic price / month or Basic price / year
3. Employees
4. Additional employee price
5. Modules
6. Order
7. Level
8. Most popular
9. Status
10. Actions

Row behavior:

- Plan cell shows an icon, plan name, and short description.
- Basic price uses the active billing cycle.
- Employees displays the included employee count.
- Additional employee price uses the active billing cycle.
- Modules is a link that opens the Module access tab.
- Order displays `#N`.
- Level displays a blue `Level N` pill.
- Most popular is an interactive star control.
- Status uses a switch and Published/Draft label.
- Actions contains Edit and Delete icon buttons.

The table is horizontally scrollable when the viewport is narrower than its content.

## 9. Create and edit membership plan drawer

Clicking “New plan” or Edit opens a right-side drawer, not a centered modal.

Desktop drawer rules:

- Opens from the right.
- Uses approximately half the viewport width (`50vw`).
- Has a dimmed backdrop.
- Contains a fixed header, compact body, and fixed footer.
- The standard desktop layout must show all fields and actions without vertical scrolling.
- Smaller responsive layouts may scroll when necessary.

Header:

- Create mode title: `Create Membership Plan`.
- Edit mode title: `Edit Membership Plan`.
- Supporting line: `Set up your membership plan with pricing and employee limits. You can edit these details anytime.`
- Close button in the top-right.

Form sections:

### Identity

- Membership title (required)
- Display order (required)
- Level (required)

Do not show helper sentences under these fields.

### Monthly billing

- Regular price (required)
- Discounted price

Do not repeat “Monthly” in these field labels because the card title already says Monthly billing.

### Annual billing

- Regular price (required)
- Discounted price

Do not repeat “Annual” or “Yearly” in these field labels because the card title already says Annual billing.

### Employees included

- Number of employees (required)

### Additional employee pricing

- Price per employee (Monthly)
- Price per employee (Yearly)

No descriptive helper sentences are displayed inside the cards. Use compact spacing so the complete form fits in a normal desktop viewport.

Create behavior:

- Default order is one higher than the current maximum order.
- Default level is one higher than the current maximum level.
- Included employees defaults to 50.
- New plans start as Draft and not recommended.
- Monthly and annual module arrays start empty.

Edit behavior:

- Every create field is editable.
- Saving updates the existing plan and closes the drawer.

## 10. Most popular behavior

The Most popular control uses a star icon.

- Selecting a plan clears `recommended` from all other plans.
- Clicking the currently selected plan clears the recommendation entirely.
- A toast confirms the change.
- The selected plan is visually highlighted on the public pricing preview.

## 11. Module access tab

The Module access page has no “Add module” button.

Header content:

- Title: Module access
- Text: Select module access separately for monthly and annual subscriptions.
- Monthly/Annual segmented selector aligned to the right.

Matrix columns:

- Module name and category.
- One checkbox column for every ordered plan.
- Available switch.

Behavior:

- Monthly selection reads/writes `plan.modules`.
- Annual selection reads/writes `plan.annualModules`.
- Monthly and annual assignments are independent.
- An unavailable module disables its plan checkboxes.
- No module price column is displayed.
- The footer contains “Save module access.”

## 12. Landing-page builder

Clicking “Edit landing page” opens a dedicated full-height builder workspace.

Desktop builder layout:

- Fixed-width editor column on the left (approximately 370px).
- Flexible preview canvas on the right.
- Back button returns to Plans & pricing.
- Publish button saves builder state.
- Desktop/mobile preview selector.

Supported sections:

1. Hero banner
2. Trust metrics
3. Subscription plans
4. HRMS walkthrough
5. Module showcase
6. Client testimonials
7. FAQs & enquiry

Builder behavior:

- Sections can be selected.
- Sections can be enabled or disabled.
- Sections can be reordered with drag-and-drop or arrow controls.
- Title/body/extra content can be edited.
- Hero image can be uploaded or reset.
- Testimonials and FAQs are repeatable editable collections.
- Selecting a section scrolls its preview into view.
- Publish writes the current builder configuration to browser storage.

Public preview behavior:

- Only enabled sections render.
- Pricing cards use active plans sorted by order.
- Monthly/Annual pricing toggle switches prices and module mappings.
- Regular price is struck through only when a valid lower discounted price exists.
- Recommended plan displays a Most popular badge.
- Pricing cards list assigned modules for the selected billing cycle.
- Preview supports desktop and mobile canvas widths.

## 13. Persistence

The prototype uses these browser storage keys:

### `wayvida-subscription-admin`

Stores:

```ts
{
  plans,
  modules,
  heroTitle,
  heroCopy,
  announcement
}
```

The loader includes backward-compatibility migration for older fields such as `price` and `extraPrice`.

### `wayvida-sidebar-collapsed`

Stores a string boolean indicating whether the navigation sidebar is collapsed.

### `wayvida-landing-builder`

Stores:

```ts
{
  sections,
  heroImage,
  testimonials,
  faqs
}
```

Important limitation: data is browser-local. It is not shared between browsers, devices, or users.

## 14. WebMCP/browser-agent support

`app/page.tsx` conditionally registers tools through `document.modelContext` when supported.

Current tools:

- `read_subscription_configuration`: returns the current plans and module catalog.
- `create_subscription_plan`: validates input and creates a draft plan.

Do not make the page fail when `document.modelContext` is unavailable.

## 15. Visual design system

Overall style:

- Professional HR/SaaS administration interface.
- White and very light blue surfaces.
- Dark navy typography.
- Blue primary actions.
- Green for published/success states.
- Soft borders, modest shadows, and 6–12px radii.
- Dense but readable table layout.
- Lucide outline icons.

Key colors are approximately:

- Primary blue: `#2167ed`
- Dark navy: `#14233c`
- Muted text: `#64748b` to `#7c8aa0`
- Border: `#dbe3ee` / `#e3e9f1`
- Success green: `#16a34a`
- Workspace background: very light gray-blue

Membership drawer cards use subtle color coding:

- Identity: light blue
- Monthly billing: light blue
- Annual billing: light green
- Employees: light violet
- Additional employee pricing: light orange

Responsive behavior:

- Sidebar becomes mobile navigation.
- Header controls wrap.
- Table uses horizontal overflow.
- Plan drawer expands from 50vw to 65vw, 85vw, then 100vw at smaller widths.
- Billing and identity grids stack when needed.
- Landing builder stacks editor and preview below 1100px.

## 16. Seed content and formatting

- Currency is Indian Rupees.
- Format values with `toLocaleString("en-IN")`.
- Currency output example: `₹2,400`.
- Included employees default: 50.
- The initial most popular plan is Professional.
- Existing plans are Essential, Professional, and Enterprise.

## 17. Notifications and confirmations

Use Sonner toast notifications for successful save, create, edit, delete, recommendation, and landing-page publish operations.

Deleting a plan requires a confirmation dialog explaining that it will be removed from both the admin list and the public pricing page.

## 18. Current prototype limitations

These are intentional current-state limitations, not reconstruction errors:

- No server database.
- No multi-user synchronization.
- No production authentication/authorization flow in the main UI.
- Search input is visual only.
- Sidebar links other than Subscription are placeholders.
- Create-plan validation is minimal.
- Module catalog creation was intentionally removed from the UI.
- The legacy simple landing editor exists in source but the primary experience is the full LandingBuilder workspace.

## 19. Reconstruction acceptance checklist

A recreation is functionally equivalent when all of the following are true:

- [ ] App starts on port 5173.
- [ ] Desktop shell, collapsible sidebar, heading, stats, and tabs render correctly.
- [ ] Plan table uses the exact required column order.
- [ ] Monthly/Annual table selector swaps plan and additional-employee pricing.
- [ ] Plans sort by order and then level.
- [ ] Create opens a right-side half-page drawer.
- [ ] Edit opens the same drawer with populated values.
- [ ] Drawer shows all fields without desktop vertical scrolling.
- [ ] Monthly and annual regular and discounted prices are editable.
- [ ] Discounted storefront price uses strike-through correctly.
- [ ] Order and level are independent editable values.
- [ ] Most popular selection is exclusive and can be cleared.
- [ ] Status switch changes Draft/Published.
- [ ] Delete uses confirmation.
- [ ] Module access has separate Monthly/Annual mappings.
- [ ] Module access has no Add module button and no price column.
- [ ] Disabled modules cannot be assigned.
- [ ] Landing builder supports section visibility and reordering.
- [ ] Landing builder supports desktop/mobile previews.
- [ ] Testimonials and FAQs are editable repeatable collections.
- [ ] State survives refresh through the documented localStorage keys.
- [ ] `npm run build` succeeds.

## 20. Prompt for another coding model

Copy the prompt below together with this document when rebuilding elsewhere:

> Build the HRMS Subscription Admin exactly as specified in `PROJECT_KNOWLEDGE_TRANSFER.md`. Treat that document as the product and UI source of truth. Implement all acceptance-checklist items, preserve the exact plan table column order, use a compact right-side membership drawer, maintain separate monthly/annual pricing and module mappings, and persist prototype state with the documented localStorage keys. Use TypeScript and React. Match the documented responsive behavior and visual system. Do not add an Add module button or module pricing column. Run the production build and fix all errors before completion.

## 21. Recommended production evolution

When moving beyond the prototype:

1. Replace `localStorage` with authenticated API routes and a relational database.
2. Add tenant and user ownership to every plan and landing-page configuration.
3. Enforce unique order/level rules if required by the business.
4. Add schema validation with Zod on both client and server.
5. Add optimistic updates with rollback on API failure.
6. Store uploaded hero assets in object storage instead of data URLs.
7. Add automated component, interaction, and accessibility tests.
8. Add audit history for pricing and publication changes.

---

Current metadata:

- Product title: `Subscription Admin | Wayvida`
- Product description: `Manage Wayvida HRMS subscription plans, modules, and landing page.`
- Primary route: `/`
- Development port: `5173`
