"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Boxes, Check, ChevronDown, CircleHelp, CreditCard, Eye, FileText, GripVertical, LayoutDashboard, Menu, MoreHorizontal, PackagePlus, Pencil, Plus, Search, Settings, Sparkles, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import { LandingBuilder } from "./landing-builder";

type Module = { id: string; name: string; category: string; active: boolean };
type Plan = { id: string; name: string; description: string; price: number; includedEmployees: number; extraPrice: number; active: boolean; recommended: boolean; modules: string[] };
type WebMcpContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown }, options?: { signal?: AbortSignal }) => void | Promise<void> };

const seedModules: Module[] = [
  ["employees", "Employees", "Core HR", true], ["attendance", "Attendance", "Core HR", true], ["leave", "Leave", "Core HR", true], ["documents", "Documents", "Core HR", true],
  ["payroll", "Payroll", "Operations", true], ["recruitment", "Recruitment", "Operations", true], ["tasks", "Tasks", "Operations", true], ["performance", "Performance", "Operations", true],
  ["helpdesk", "Helpdesk", "Collaboration", true], ["connect", "Connect", "Collaboration", true], ["lms", "LMS", "Learning", true], ["compliance", "Compliance", "Learning", false],
].map(([id, name, category, active]) => ({ id, name, category, active } as Module));

const seedPlans: Plan[] = [
  { id: "essential", name: "Essential", description: "Core HR foundation for growing teams.", price: 2400, includedEmployees: 50, extraPrice: 48, active: true, recommended: false, modules: ["employees", "attendance", "leave", "documents"] },
  { id: "professional", name: "Professional", description: "Complete HR operations and work management.", price: 4800, includedEmployees: 50, extraPrice: 96, active: true, recommended: true, modules: ["employees", "attendance", "leave", "documents", "payroll", "recruitment", "tasks", "performance", "helpdesk", "connect"] },
  { id: "enterprise", name: "Enterprise", description: "People operations, work, and learning together.", price: 7200, includedEmployees: 50, extraPrice: 144, active: true, recommended: false, modules: seedModules.filter((m) => m.id !== "compliance").map((m) => m.id) },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function Home() {
  const [plans, setPlans] = useState(seedPlans);
  const [modules, setModules] = useState(seedModules);
  const [tab, setTab] = useState("plans");
  const [editing, setEditing] = useState(false);
  const [planDialog, setPlanDialog] = useState(false);
  const [moduleDialog, setModuleDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [heroTitle, setHeroTitle] = useState("Simple HRMS pricing that grows with your team");
  const [heroCopy, setHeroCopy] = useState("Choose the right plan for your people operations. All plans are billed annually.");
  const [announcement, setAnnouncement] = useState("Save 15% with annual billing");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("wayvida-subscription-admin") || "null");
      if (data) { setPlans(data.plans || seedPlans); setModules(data.modules || seedModules); setHeroTitle(data.heroTitle || heroTitle); setHeroCopy(data.heroCopy || heroCopy); setAnnouncement(data.announcement || announcement); }
    } catch { /* retain defaults */ }
  }, []);

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
        inputSchema: { type: "object", properties: { name: { type: "string" }, price: { type: "number", minimum: 0 }, includedEmployees: { type: "integer", minimum: 1 }, extraPrice: { type: "number", minimum: 0 }, modules: { type: "array", items: { type: "string" } } }, required: ["name", "price", "includedEmployees", "extraPrice"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          const value = input as Partial<Plan>;
          if (!value.name?.trim() || typeof value.price !== "number" || typeof value.includedEmployees !== "number" || typeof value.extraPrice !== "number") throw new Error("Valid name and pricing values are required.");
          const plan: Plan = { id: `${value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: value.name.trim(), description: "A flexible plan for your customers.", price: value.price, includedEmployees: value.includedEmployees, extraPrice: value.extraPrice, active: false, recommended: false, modules: (value.modules || []).filter((id) => modules.some((module) => module.id === id)) };
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
  const toggleModule = (planId: string, moduleId: string) => setPlans((all) => all.map((p) => p.id !== planId ? p : ({ ...p, modules: p.modules.includes(moduleId) ? p.modules.filter((id) => id !== moduleId) : [...p.modules, moduleId] })));
  const activePlans = useMemo(() => plans.filter((p) => p.active), [plans]);
  const save = () => { persist(); setEditing(false); toast.success("Subscription changes saved"); };
  const createPlan = () => {
    if (!draft.trim()) return;
    const next = [...plans, { id: `${draft.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: draft.trim(), description: "A flexible plan for your customers.", price: 0, includedEmployees: 50, extraPrice: 0, active: false, recommended: false, modules: [] }];
    setPlans(next); persist(next, modules); setDraft(""); setPlanDialog(false); toast.success("Plan created");
  };
  const createModule = () => {
    if (!draft.trim()) return;
    const next = [...modules, { id: `${draft.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: draft.trim(), category: "Custom", active: true }];
    setModules(next); persist(plans, next); setDraft(""); setModuleDialog(false); toast.success("Module added");
  };
  const deletePlan = () => { const next = plans.filter((p) => p.id !== deleteId); setPlans(next); persist(next, modules); setDeleteId(null); toast.success("Plan deleted"); };

  return <div className="app-shell">
    <Toaster richColors position="top-right" />
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><span>W</span>Wayvida<button onClick={() => setMobileNav(false)} aria-label="Close"><X /></button></div>
      <p className="side-label">WORKSPACE</p>
      <nav><a href="#"><LayoutDashboard />Dashboard</a><a href="#"><Users />Customers</a><a className="active" href="#"><CreditCard />Subscription</a><a href="#"><Boxes />Modules</a><a href="#"><FileText />Invoices</a></nav>
      <div className="side-bottom"><a href="#"><Settings />Settings</a><a href="#"><CircleHelp />Help & support</a><div className="profile"><b>AK</b><span><strong>Arun Kumar</strong><small>Super admin</small></span><MoreHorizontal /></div></div>
    </aside>
    <main>
      <header className="topbar"><button className="menu" onClick={() => setMobileNav(true)}><Menu /></button><label className="search"><Search /><input placeholder="Search customers, plans..." /><kbd>⌘ K</kbd></label><div className="top-actions"><Bell /><b>AK</b><ChevronDown /></div></header>
      <div className="content">
        <div className="heading"><div><p>Settings <span>/</span> Subscription</p><h1>Subscription</h1><small>Manage pricing plans, module access, and your public pricing page.</small></div><div><Button variant="outline" onClick={() => setTab("builder")}><Eye />Edit landing page</Button><Button onClick={() => setPlanDialog(true)}><Plus />New plan</Button></div></div>
        <section className="stats"><article><i className="blue"><CreditCard /></i><span><b>{plans.length}</b><small>Total plans</small></span></article><article><i className="green"><Check /></i><span><b>{activePlans.length}</b><small>Published plans</small></span></article><article><i className="amber"><Boxes /></i><span><b>{modules.filter((m) => m.active).length}</b><small>Active modules</small></span></article><article><i className="violet"><Sparkles /></i><span><b>{plans.find((p) => p.recommended)?.name || "None"}</b><small>Recommended plan</small></span></article></section>
        <Tabs value={tab} onValueChange={setTab} className="tabs"><TabsList variant="line"><TabsTrigger value="plans">Plans & pricing</TabsTrigger><TabsTrigger value="modules">Module access</TabsTrigger><TabsTrigger value="builder">Landing page</TabsTrigger></TabsList>
          <TabsContent value="plans"><section className="panel"><PanelHead title="Plans & pricing" text="Edit several plans together, then save once."><Button variant="outline" onClick={() => setEditing(!editing)}><Pencil />{editing ? "Cancel editing" : "Bulk edit"}</Button>{editing && <Button onClick={save}><Check />Save changes</Button>}</PanelHead><div className="table-scroll"><table><thead><tr><th>Plan</th><th>Base price / month</th><th>Included employees</th><th>Additional employee</th><th>Modules</th><th>Status</th><th /></tr></thead><tbody>{plans.map((p) => <tr key={p.id}><td><div className="plan-name"><GripVertical /><i className={p.id.includes("professional") ? "coral" : p.id.includes("enterprise") ? "violet" : "blue"}><CreditCard /></i><span>{editing ? <Input value={p.name} onChange={(e) => updatePlan(p.id, { name: e.target.value })} /> : <strong>{p.name}</strong>}<small>{p.recommended ? "Recommended" : p.description}</small></span></div></td><td>{editing ? <Input type="number" value={p.price} onChange={(e) => updatePlan(p.id, { price: +e.target.value })} /> : <strong>{money(p.price)}</strong>}</td><td>{editing ? <Input type="number" value={p.includedEmployees} onChange={(e) => updatePlan(p.id, { includedEmployees: +e.target.value })} /> : `${p.includedEmployees} employees`}</td><td>{editing ? <Input type="number" value={p.extraPrice} onChange={(e) => updatePlan(p.id, { extraPrice: +e.target.value })} /> : `${money(p.extraPrice)} / employee`}</td><td><button className="module-link" onClick={() => setTab("modules")}>{p.modules.length} modules <ChevronDown /></button></td><td><label className="status"><Switch checked={p.active} onCheckedChange={(active) => updatePlan(p.id, { active })} /><span className={p.active ? "live" : "draft"}>{p.active ? "Published" : "Draft"}</span></label></td><td><div className="row-actions"><button onClick={() => setEditing(true)}><Pencil /></button><button onClick={() => setDeleteId(p.id)}><Trash2 /></button></div></td></tr>)}</tbody></table></div><button className="add-row" onClick={() => setPlanDialog(true)}><Plus />Add another plan</button></section></TabsContent>
          <TabsContent value="modules"><section className="panel"><PanelHead title="Module access" text="Choose which modules customers receive with each plan."><Button onClick={() => { setDraft(""); setModuleDialog(true); }}><PackagePlus />Add module</Button></PanelHead><div className="table-scroll"><table className="matrix"><thead><tr><th>Module</th>{plans.map((p) => <th key={p.id}>{p.name}</th>)}<th>Available</th></tr></thead><tbody>{modules.map((m) => <tr key={m.id}><td><strong>{m.name}</strong><small>{m.category}</small></td>{plans.map((p) => <td key={p.id}><Checkbox disabled={!m.active} checked={p.modules.includes(m.id)} onCheckedChange={() => toggleModule(p.id, m.id)} /></td>)}<td><Switch checked={m.active} onCheckedChange={(active) => setModules((all) => all.map((item) => item.id === m.id ? { ...item, active } : item))} /></td></tr>)}</tbody></table></div><footer className="panel-footer"><span>Changes affect new subscriptions after publishing.</span><Button onClick={save}><Check />Save module access</Button></footer></section></TabsContent>
          <TabsContent value="landing"><div className="landing"><section className="panel editor"><PanelHead title="Landing page" text="Edit the content shown above your pricing plans." /><label>Announcement<Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} /></label><label>Page heading<Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} /></label><label>Supporting text<textarea rows={4} value={heroCopy} onChange={(e) => setHeroCopy(e.target.value)} /></label><div className="options"><label><span>Show annual billing message<small>Displayed beside each monthly price</small></span><Switch defaultChecked /></label><label><span>Show recommended badge<small>Highlight your preferred plan</small></span><Switch defaultChecked /></label></div><Button onClick={save}><Check />Publish changes</Button></section><section className="preview"><header><span><Eye />Live preview</span><span>Desktop</span></header><div className="site-preview"><em>{announcement}</em><h2>{heroTitle}</h2><p>{heroCopy}</p><div className="preview-plans">{activePlans.slice(0, 3).map((p) => <article className={p.recommended ? "featured" : ""} key={p.id}>{p.recommended && <mark>Most popular</mark>}<h3>{p.name}</h3><div><b>{money(p.price)}</b><small>/month</small></div><p>For {p.includedEmployees} employees</p><ul>{p.modules.slice(0, 4).map((id) => <li key={id}><Check />{modules.find((m) => m.id === id)?.name}</li>)}</ul><button>Choose {p.name}</button></article>)}</div></div></section></div></TabsContent>
          <TabsContent value="builder"><LandingBuilder plans={plans} modules={modules} /></TabsContent>
        </Tabs>
      </div>
    </main>
    <CreateDialog open={planDialog} setOpen={setPlanDialog} title="Create subscription plan" description="Add the plan now, then configure its price and modules in the table." label="Plan name" placeholder="e.g. Growth" draft={draft} setDraft={setDraft} submit={createPlan} action="Create plan" />
    <CreateDialog open={moduleDialog} setOpen={setModuleDialog} title="Add a module" description="The new module will be available to map across every subscription plan." label="Module name" placeholder="e.g. Asset management" draft={draft} setDraft={setDraft} submit={createModule} action="Add module" />
    <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}><DialogContent><DialogHeader><DialogTitle>Delete this plan?</DialogTitle><DialogDescription>This removes the plan from the admin list and public pricing page. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={deletePlan}><Trash2 />Delete plan</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function PanelHead({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) { return <header className="panel-head"><div><h2>{title}</h2><p>{text}</p></div>{children && <div>{children}</div>}</header>; }
function CreateDialog({ open, setOpen, title, description, label, placeholder, draft, setDraft, submit, action }: { open: boolean; setOpen: (v: boolean) => void; title: string; description: string; label: string; placeholder: string; draft: string; setDraft: (v: string) => void; submit: () => void; action: string }) { return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><label className="dialog-field">{label}<Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && submit()} /></label><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>{action}</Button></DialogFooter></DialogContent></Dialog>; }
