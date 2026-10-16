"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Boxes, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, CreditCard, Crown, Eye, GripVertical, LayoutDashboard, ListTodo, Menu, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, Settings, Sparkles, Star, Trash2, UserPlus, UserRound, UserSearch, Users, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import { LandingBuilder } from "./landing-builder";

type Module = { id: string; name: string; category: string; active: boolean; price: number };
type Plan = { id: string; name: string; description: string; order: number; level: number; monthlyPrice: number; monthlyDiscountedPrice: number; annualPrice: number; annualDiscountedPrice: number; includedEmployees: number; monthlyExtraPrice: number; annualExtraPrice: number; active: boolean; recommended: boolean; modules: string[]; annualModules: string[] };
type PlanDraft = { name: string; order: number; level: number; monthlyPrice: number; monthlyDiscountedPrice: number; annualPrice: number; annualDiscountedPrice: number; includedEmployees: number; monthlyExtraPrice: number; annualExtraPrice: number };
type WebMcpContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown }, options?: { signal?: AbortSignal }) => void | Promise<void> };

const seedModules: Module[] = [
  ["employees", "Employees", "Core HR", true, 400], ["attendance", "Attendance", "Core HR", true, 350], ["leave", "Leave", "Core HR", true, 250], ["documents", "Documents", "Core HR", true, 200],
  ["payroll", "Payroll", "Operations", true, 800], ["recruitment", "Recruitment", "Operations", true, 650], ["tasks", "Tasks", "Operations", true, 450], ["performance", "Performance", "Operations", true, 600],
  ["helpdesk", "Helpdesk", "Collaboration", true, 300], ["connect", "Connect", "Collaboration", true, 250], ["lms", "LMS", "Learning", true, 700], ["compliance", "Compliance", "Learning", false, 500],
].map(([id, name, category, active, price]) => ({ id, name, category, active, price } as Module));

const seedPlans: Plan[] = [
  { id: "essential", name: "Essential", description: "Core HR foundation for growing teams.", order: 1, level: 1, monthlyPrice: 2400, monthlyDiscountedPrice: 2400, annualPrice: 24000, annualDiscountedPrice: 24000, includedEmployees: 50, monthlyExtraPrice: 48, annualExtraPrice: 480, active: true, recommended: false, modules: ["employees", "attendance", "leave", "documents"], annualModules: ["employees", "attendance", "leave", "documents"] },
  { id: "professional", name: "Professional", description: "Complete HR operations and work management.", order: 2, level: 2, monthlyPrice: 4800, monthlyDiscountedPrice: 4800, annualPrice: 48000, annualDiscountedPrice: 48000, includedEmployees: 50, monthlyExtraPrice: 96, annualExtraPrice: 960, active: true, recommended: true, modules: ["employees", "attendance", "leave", "documents", "payroll", "recruitment", "tasks", "performance", "helpdesk", "connect"], annualModules: ["employees", "attendance", "leave", "documents", "payroll", "recruitment", "tasks", "performance", "helpdesk", "connect"] },
  { id: "enterprise", name: "Enterprise", description: "People operations, work, and learning together.", order: 3, level: 3, monthlyPrice: 7200, monthlyDiscountedPrice: 7200, annualPrice: 72000, annualDiscountedPrice: 72000, includedEmployees: 50, monthlyExtraPrice: 144, annualExtraPrice: 1440, active: true, recommended: false, modules: seedModules.filter((m) => m.id !== "compliance").map((m) => m.id), annualModules: seedModules.filter((m) => m.id !== "compliance").map((m) => m.id) },
];

const emptyPlanDraft = (order: number): PlanDraft => ({ name: "", order, level: order, monthlyPrice: 0, monthlyDiscountedPrice: 0, annualPrice: 0, annualDiscountedPrice: 0, includedEmployees: 50, monthlyExtraPrice: 0, annualExtraPrice: 0 });

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function Home() {
  const [plans, setPlans] = useState(seedPlans);
  const [modules, setModules] = useState(seedModules);
  const [tab, setTab] = useState("plans");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanDraft, setEditPlanDraft] = useState<PlanDraft | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [moduleBillingCycle, setModuleBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [planDialog, setPlanDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [heroTitle, setHeroTitle] = useState("Simple HRMS pricing that grows with your team");
  const [heroCopy, setHeroCopy] = useState("Choose the right plan for your people operations. All plans are billed annually.");
  const [announcement, setAnnouncement] = useState("Save 15% with annual billing");
  const [planDraft, setPlanDraft] = useState<PlanDraft>(() => emptyPlanDraft(seedPlans.length + 1));

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("wayvida-subscription-admin") || "null");
      if (data) { setPlans((data.plans || seedPlans).map((plan: Plan & { price?: number; extraPrice?: number }, index: number) => { const monthlyPrice = Number(plan.monthlyPrice ?? plan.price) || 0; const annualPrice = Number(plan.annualPrice) || monthlyPrice * 10; return ({ ...plan, order: Number(plan.order) || index + 1, level: Number(plan.level) || index + 1, monthlyPrice, monthlyDiscountedPrice: Number(plan.monthlyDiscountedPrice) || monthlyPrice, annualPrice, annualDiscountedPrice: Number(plan.annualDiscountedPrice) || annualPrice, monthlyExtraPrice: Number(plan.monthlyExtraPrice ?? plan.extraPrice) || 0, annualExtraPrice: Number(plan.annualExtraPrice) || (Number(plan.monthlyExtraPrice ?? plan.extraPrice) || 0) * 10, modules: plan.modules || [], annualModules: plan.annualModules || plan.modules || [] }); })); setModules((data.modules || seedModules).map((module: Module) => ({ ...module, price: Number(module.price) || 0 }))); setHeroTitle(data.heroTitle || heroTitle); setHeroCopy(data.heroCopy || heroCopy); setAnnouncement(data.announcement || announcement); }
    } catch { /* retain defaults */ }
  }, []);

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem("wayvida-sidebar-collapsed") === "true");
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((current) => {
    const next = !current;
    localStorage.setItem("wayvida-sidebar-collapsed", String(next));
    return next;
  });

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: "read_subscription_configuration",
        title: "Read subscription configuration",
        description: "Return the plans and module catalog currently visible in the subscription admin.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => ({ plans, modules }),
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: "create_subscription_plan",
        title: "Create subscription plan",
        description: "Create a draft subscription plan with pricing and an optional list of module IDs.",
        inputSchema: { type: "object", properties: { name: { type: "string" }, order: { type: "integer", minimum: 1 }, level: { type: "integer", minimum: 1 }, monthlyPrice: { type: "number", minimum: 0 }, monthlyDiscountedPrice: { type: "number", minimum: 0 }, annualPrice: { type: "number", minimum: 0 }, annualDiscountedPrice: { type: "number", minimum: 0 }, includedEmployees: { type: "integer", minimum: 1 }, monthlyExtraPrice: { type: "number", minimum: 0 }, annualExtraPrice: { type: "number", minimum: 0 }, modules: { type: "array", items: { type: "string" } } }, required: ["name", "order", "level", "monthlyPrice", "monthlyDiscountedPrice", "annualPrice", "annualDiscountedPrice", "includedEmployees"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          const value = input as Partial<Plan>;
          if (!value.name?.trim() || typeof value.monthlyPrice !== "number" || typeof value.annualPrice !== "number" || typeof value.includedEmployees !== "number") throw new Error("Valid name, order, level, and pricing values are required.");
          const selectedModules = (value.modules || []).filter((id) => modules.some((module) => module.id === id));
          const plan: Plan = { id: `${value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: value.name.trim(), description: "A flexible plan for your customers.", order: value.order || plans.length + 1, level: value.level || plans.length + 1, monthlyPrice: value.monthlyPrice, monthlyDiscountedPrice: value.monthlyDiscountedPrice ?? value.monthlyPrice, annualPrice: value.annualPrice, annualDiscountedPrice: value.annualDiscountedPrice ?? value.annualPrice, includedEmployees: value.includedEmployees, monthlyExtraPrice: value.monthlyExtraPrice || 0, annualExtraPrice: value.annualExtraPrice || 0, active: false, recommended: false, modules: selectedModules, annualModules: selectedModules };
          setPlans((current) => { const next = [...current, plan]; persist(next, modules); return next; });
          return { id: plan.id, status: "draft", name: plan.name };
        },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [plans, modules]);

  const persist = (nextPlans = plans, nextModules = modules) => localStorage.setItem("wayvida-subscription-admin", JSON.stringify({ plans: nextPlans, modules: nextModules, heroTitle, heroCopy, announcement }));
  const updatePlan = (id: string, patch: Partial<Plan>) => setPlans((all) => all.map((p) => p.id === id ? { ...p, ...patch } : p));
  const setMostPopular = (id: string) => {
    const next = plans.map((p) => ({ ...p, recommended: p.id === id ? !p.recommended : false }));
    setPlans(next); persist(next, modules);
    const chosen = next.find((p) => p.recommended);
    toast.success(chosen ? `${chosen.name} is now the most popular plan` : "No plan is marked as most popular");
  };
  const updateModule = (id: string, patch: Partial<Module>) => setModules((all) => all.map((module) => module.id === id ? { ...module, ...patch } : module));
  const toggleModule = (planId: string, moduleId: string) => setPlans((all) => all.map((p) => {
    if (p.id !== planId) return p;
    const key = moduleBillingCycle === "monthly" ? "modules" : "annualModules";
    const selected = p[key];
    return { ...p, [key]: selected.includes(moduleId) ? selected.filter((id) => id !== moduleId) : [...selected, moduleId] };
  }));
  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.order - b.order || a.level - b.level), [plans]);
  const activePlans = useMemo(() => orderedPlans.filter((p) => p.active), [orderedPlans]);
  const save = () => { persist(); toast.success("Subscription changes saved"); };
  const openPlanEditor = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setEditPlanDraft({ name: plan.name, order: plan.order, level: plan.level, monthlyPrice: plan.monthlyPrice, monthlyDiscountedPrice: plan.monthlyDiscountedPrice, annualPrice: plan.annualPrice, annualDiscountedPrice: plan.annualDiscountedPrice, includedEmployees: plan.includedEmployees, monthlyExtraPrice: plan.monthlyExtraPrice, annualExtraPrice: plan.annualExtraPrice });
  };
  const saveEditedPlan = () => {
    if (!editingPlanId || !editPlanDraft?.name.trim()) return;
    const next = plans.map((plan) => plan.id === editingPlanId ? { ...plan, ...editPlanDraft, name: editPlanDraft.name.trim() } : plan);
    setPlans(next); persist(next, modules); setEditingPlanId(null); setEditPlanDraft(null); toast.success("Plan updated");
  };
  const createPlan = () => {
    if (!planDraft.name.trim()) return;
    const next = [...plans, { id: `${planDraft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: planDraft.name.trim(), description: "A flexible plan for your customers.", ...planDraft, active: false, recommended: false, modules: [], annualModules: [] }];
    setPlans(next); persist(next, modules); setPlanDraft(emptyPlanDraft(next.length + 1)); setPlanDialog(false); toast.success("Plan created");
  };
  const openPlanCreator = () => {
    const nextOrder = Math.max(0, ...plans.map((plan) => plan.order)) + 1;
    const nextLevel = Math.max(0, ...plans.map((plan) => plan.level)) + 1;
    setPlanDraft({ ...emptyPlanDraft(nextOrder), level: nextLevel });
    setPlanDialog(true);
  };
  const deletePlan = () => { const next = plans.filter((p) => p.id !== deleteId); setPlans(next); persist(next, modules); setDeleteId(null); toast.success("Plan deleted"); };

  return <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <Toaster richColors position="top-right" />
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><span><Check /></span><strong>HRMS</strong><button className="desktop-collapse" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expand master menu" : "Collapse master menu"}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close"><X /></button></div>
      <p className="side-label">WORKSPACE</p>
      <nav>
        <a href="#" title="Dashboard"><LayoutDashboard /><span>Dashboard</span></a>
        <a href="#" title="Employees"><UserRound /><span>Employees</span></a>
        <a href="#" title="Departments"><Building2 /><span>Departments</span></a>
        <a href="#" title="Designations"><BriefcaseBusiness /><span>Designations</span></a>
        <a href="#" title="Customers"><Users /><span>Customers</span></a>
        <a href="#" title="Attendance"><Clock3 /><span>Attendance</span></a>
        <a href="#" title="Leave"><CalendarDays /><span>Leave</span></a>
        <a href="#" title="Tasks"><ListTodo /><span>Tasks</span></a>
        <a href="#" title="Payroll"><WalletCards /><span>Payroll</span></a>
        <a href="#" title="Recruitment"><UserSearch /><span>Recruitment</span></a>
        <a className="active" href="#" title="Subscription"><CreditCard /><span>Subscription</span></a>
      </nav>
      <div className="side-bottom"><a href="#"><Settings /><span>Settings</span></a><a href="#"><CircleHelp /><span>Help & support</span></a><div className="profile"><b>AK</b><span><strong>Arun Kumar</strong><small>Super admin</small></span><MoreHorizontal /></div></div>
    </aside>
    <main>
      {tab !== "builder" && <header className="topbar"><button className="menu" onClick={() => setMobileNav(true)}><Menu /></button><div className="top-actions"><Bell /><b>AK</b><ChevronDown /></div></header>}
      <div className={`content ${tab === "builder" ? "builder-content" : ""}`}>
        {tab !== "builder" && <><div className="heading"><div><h1>Subscription</h1><small>Manage pricing plans, module access, and your public pricing page.</small></div><div className="heading-tools"><label className="search module-search"><Search /><input placeholder="Search customers, plans..." /><kbd>⌘ K</kbd></label><Button variant="outline" onClick={() => setTab("builder")}><Eye />Edit landing page</Button><Button onClick={openPlanCreator}><Plus />New plan</Button></div></div><section className="stats"><article><i className="blue"><CreditCard /></i><span><b>{plans.length}</b><small>Total plans</small></span></article><article><i className="green"><Check /></i><span><b>{activePlans.length}</b><small>Published plans</small></span></article><article><i className="amber"><Boxes /></i><span><b>{modules.filter((m) => m.active).length}</b><small>Active modules</small></span></article><article><i className="violet"><Sparkles /></i><span><b>{plans.find((p) => p.recommended)?.name || "None"}</b><small>Most popular plan</small></span></article></section></>}
        <Tabs value={tab} onValueChange={setTab} className="tabs">{tab !== "builder" && <TabsList variant="line"><TabsTrigger value="plans">Plans & pricing</TabsTrigger><TabsTrigger value="modules">Module access</TabsTrigger><TabsTrigger value="builder">Landing page</TabsTrigger></TabsList>}
          <TabsContent value="plans"><section className="panel"><PanelHead title="Plans & pricing" text="Order, level, and billing prices are saved separately for each plan."><div className="billing-tabs" role="group" aria-label="Billing period"><button className={billingCycle === "monthly" ? "active" : ""} onClick={() => setBillingCycle("monthly")}>Monthly</button><button className={billingCycle === "annual" ? "active" : ""} onClick={() => setBillingCycle("annual")}>Annual</button></div></PanelHead><div className="table-scroll"><table><thead><tr><th>Plan</th><th>Basic price / {billingCycle === "monthly" ? "month" : "year"}</th><th>Employees</th><th>Additional employee price</th><th>Modules</th><th>Order</th><th>Level</th><th>Most popular</th><th>Status</th><th>Actions</th></tr></thead><tbody>{orderedPlans.map((p) => <tr key={p.id}><td><div className="plan-name"><GripVertical /><i className={p.id.includes("professional") ? "coral" : p.id.includes("enterprise") ? "violet" : "blue"}><CreditCard /></i><span><strong>{p.name}</strong><small>{p.description}</small></span></div></td><td><strong>{money(billingCycle === "monthly" ? p.monthlyPrice : p.annualPrice)}</strong></td><td>{p.includedEmployees} employees</td><td>{money(billingCycle === "monthly" ? p.monthlyExtraPrice : p.annualExtraPrice)} / employee</td><td><button className="module-link" onClick={() => setTab("modules")}>{p.modules.length} modules <ChevronDown /></button></td><td><strong>#{p.order}</strong></td><td><span className="level-pill">Level {p.level}</span></td><td><button className={`popular-pick${p.recommended ? " on" : ""}`} aria-pressed={p.recommended} onClick={() => setMostPopular(p.id)} title={p.recommended ? "Remove most popular" : "Set as most popular"}><Star />{p.recommended ? "Most popular" : "Select"}</button></td><td><label className="status"><Switch checked={p.active} onCheckedChange={(active) => updatePlan(p.id, { active })} /><span className={p.active ? "live" : "draft"}>{p.active ? "Published" : "Draft"}</span></label></td><td><div className="row-actions"><button onClick={() => openPlanEditor(p)} aria-label={`Edit ${p.name}`}><Pencil /></button><button onClick={() => setDeleteId(p.id)} aria-label={`Delete ${p.name}`}><Trash2 /></button></div></td></tr>)}</tbody></table></div><button className="add-row" onClick={openPlanCreator}><Plus />Add another plan</button></section></TabsContent>
          <TabsContent value="modules"><section className="panel"><PanelHead title="Module access" text="Select module access separately for monthly and annual subscriptions."><div className="billing-tabs" role="group" aria-label="Module billing period"><button className={moduleBillingCycle === "monthly" ? "active" : ""} onClick={() => setModuleBillingCycle("monthly")}>Monthly</button><button className={moduleBillingCycle === "annual" ? "active" : ""} onClick={() => setModuleBillingCycle("annual")}>Annual</button></div></PanelHead><div className="table-scroll"><table className="matrix"><thead><tr><th>Module</th>{orderedPlans.map((p) => <th key={p.id}>{p.name}</th>)}<th>Available</th></tr></thead><tbody>{modules.map((m) => <tr key={m.id}><td><strong>{m.name}</strong><small>{m.category}</small></td>{orderedPlans.map((p) => <td key={p.id}><Checkbox disabled={!m.active} checked={(moduleBillingCycle === "monthly" ? p.modules : p.annualModules).includes(m.id)} onCheckedChange={() => toggleModule(p.id, m.id)} aria-label={`${m.name} in ${p.name} ${moduleBillingCycle}`} /></td>)}<td><Switch checked={m.active} onCheckedChange={(active) => updateModule(m.id, { active })} /></td></tr>)}</tbody></table></div><footer className="panel-footer"><span>Monthly and annual module access are saved independently.</span><Button onClick={save}><Check />Save module access</Button></footer></section></TabsContent>
          <TabsContent value="landing"><div className="landing"><section className="panel editor"><PanelHead title="Landing page" text="Edit the content shown above your pricing plans." /><label>Announcement<Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} /></label><label>Page heading<Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} /></label><label>Supporting text<textarea rows={4} value={heroCopy} onChange={(e) => setHeroCopy(e.target.value)} /></label><div className="options"><label><span>Show annual billing message<small>Displayed beside each monthly price</small></span><Switch defaultChecked /></label><label><span>Show most popular badge<small>Highlight your most popular plan</small></span><Switch defaultChecked /></label></div><Button onClick={save}><Check />Publish changes</Button></section><section className="preview"><header><span><Eye />Live preview</span><span>Desktop</span></header><div className="site-preview"><em>{announcement}</em><h2>{heroTitle}</h2><p>{heroCopy}</p><div className="preview-plans">{activePlans.slice(0, 3).map((p) => { const discounted = p.monthlyDiscountedPrice > 0 && p.monthlyDiscountedPrice < p.monthlyPrice; return <article className={p.recommended ? "featured" : ""} key={p.id}>{p.recommended && <mark>Most popular</mark>}<h3>{p.name}</h3><div>{discounted && <del>{money(p.monthlyPrice)}</del>}<b>{money(discounted ? p.monthlyDiscountedPrice : p.monthlyPrice)}</b><small>/month</small></div><p>For {p.includedEmployees} employees</p><ul>{p.modules.slice(0, 4).map((id) => <li key={id}><Check />{modules.find((m) => m.id === id)?.name}</li>)}</ul><button>Choose {p.name}</button></article>; })}</div></div></section></div></TabsContent>
          <TabsContent value="builder"><LandingBuilder plans={orderedPlans} modules={modules} onExit={() => setTab("plans")} /></TabsContent>
        </Tabs>
      </div>
    </main>
    <PlanDialog open={planDialog} setOpen={setPlanDialog} value={planDraft} setValue={setPlanDraft} submit={createPlan} />
    {editPlanDraft && <PlanDialog open={!!editingPlanId} setOpen={(open) => { if (!open) { setEditingPlanId(null); setEditPlanDraft(null); } }} value={editPlanDraft} setValue={(next) => setEditPlanDraft((current) => typeof next === "function" ? next(current || editPlanDraft) : next)} submit={saveEditedPlan} title="Edit subscription plan" description="Update the order, level, monthly pricing, and annual pricing in one place." action="Save changes" />}
    <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}><DialogContent><DialogHeader><DialogTitle>Delete this plan?</DialogTitle><DialogDescription>This removes the plan from the admin list and public pricing page. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={deletePlan}><Trash2 />Delete plan</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function PanelHead({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) { return <header className="panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children && <div>{children}</div>}</header>; }
function PlanDialog({ open, setOpen, value, setValue, submit, title = "Create subscription plan", description = "Add the plan order, level, and both billing prices now. You can edit every value later from the table.", action = "Create plan" }: { open: boolean; setOpen: (v: boolean) => void; value: PlanDraft; setValue: React.Dispatch<React.SetStateAction<PlanDraft>>; submit: () => void; title?: string; description?: string; action?: string }) {
  const field = (key: keyof PlanDraft, next: string) => setValue((current) => ({ ...current, [key]: key === "name" ? next : Math.max(0, Number(next)) }));
  if (!open) return null;
  return <div className="plan-drawer-layer"><button className="plan-drawer-backdrop" onClick={() => setOpen(false)} aria-label="Close plan panel" /><aside className="plan-drawer membership-drawer" role="dialog" aria-modal="true" aria-labelledby="plan-drawer-title"><header><div><h2 id="plan-drawer-title">{title === "Create subscription plan" ? "Create Membership Plan" : "Edit Membership Plan"}</h2><p>Set up your membership plan with pricing and employee limits. You can edit these details anytime.</p></div><button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close"><X /></button></header><div className="plan-drawer-body membership-form">
    <section className="form-card identity-card"><i><Crown /></i><div className="form-card-content identity-grid"><label className="title-field"><b>Membership title <em>*</em></b><Input autoFocus value={value.name} onChange={(e) => field("name", e.target.value)} placeholder="e.g. Growth, Pro, Enterprise" /></label><label><b>Display order <em>*</em></b><Input type="number" min="1" value={value.order} onChange={(e) => field("order", e.target.value)} /></label><label><b>Level <em>*</em></b><Input type="number" min="1" value={value.level} onChange={(e) => field("level", e.target.value)} /></label></div></section>
    <div className="billing-card-grid"><section className="form-card monthly-card"><i><CalendarDays /></i><div className="form-card-content"><header><b>Monthly billing</b></header><div className="two-fields"><MoneyField label="Regular price" required value={value.monthlyPrice} onChange={(next) => field("monthlyPrice", next)} /><MoneyField label="Discounted price" value={value.monthlyDiscountedPrice} onChange={(next) => field("monthlyDiscountedPrice", next)} /></div></div></section><section className="form-card annual-card"><i><CalendarDays /></i><div className="form-card-content"><header><b>Annual billing</b></header><div className="two-fields"><MoneyField label="Regular price" required value={value.annualPrice} onChange={(next) => field("annualPrice", next)} /><MoneyField label="Discounted price" value={value.annualDiscountedPrice} onChange={(next) => field("annualDiscountedPrice", next)} /></div></div></section></div>
    <section className="form-card employees-card"><i><Users /></i><div className="form-card-content employee-row"><header><b>Employees included</b></header><label><b>Number of employees <em>*</em></b><Input type="number" min="1" value={value.includedEmployees} onChange={(e) => field("includedEmployees", e.target.value)} /></label></div></section>
    <section className="form-card extra-card"><i><UserPlus /></i><div className="form-card-content"><header><b>Additional employee pricing</b></header><div className="two-fields"><MoneyField label="Price per employee (Monthly)" value={value.monthlyExtraPrice} onChange={(next) => field("monthlyExtraPrice", next)} /><MoneyField label="Price per employee (Yearly)" value={value.annualExtraPrice} onChange={(next) => field("annualExtraPrice", next)} /></div></div></section>
  </div><footer><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>{action === "Create plan" ? "Create plan" : action}</Button></footer></aside></div>;
}
function MoneyField({ label, value, onChange, help, required = false }: { label: string; value: number; onChange: (value: string) => void; help?: string; required?: boolean }) { return <label className="money-field"><b>{label} {required && <em>*</em>}</b><span><i>₹</i><Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} /></span>{help && <small>{help}</small>}</label>; }
