"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Monitor, Plus, Save, Smartphone, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type BuilderModule = { id: string; name: string; category: string; active: boolean };
export type BuilderPlan = { id: string; name: string; description: string; price: number; includedEmployees: number; extraPrice: number; active: boolean; recommended: boolean; modules: string[] };
type SectionId = "hero" | "metrics" | "plans" | "walkthrough" | "modules" | "testimonials" | "faq";
type PageSection = { id: SectionId; label: string; enabled: boolean; title: string; body: string; extra: string };
type Testimonial = { id: string; name: string; role: string; quote: string };
type Faq = { id: string; question: string; answer: string };

const defaults: PageSection[] = [
  { id: "hero", label: "Hero banner", enabled: true, title: "One HRMS for people, payroll, and progress", body: "Manage attendance, payroll, tasks, and learning in one connected platform.", extra: "Per-employee pricing • Annual billing • Built for growing teams" },
  { id: "metrics", label: "Trust metrics", enabled: true, title: "34,000+|35,00,000+|30+", body: "Customers|Employees|Countries", extra: "" },
  { id: "plans", label: "Subscription plans", enabled: true, title: "Subscription plans", body: "Three easy bundles with a fixed price for up to 50 employees. Add only the employees above 50 when your team grows.", extra: "Get pricing for your team" },
  { id: "walkthrough", label: "HRMS walkthrough", enabled: true, title: "See how one connected platform keeps your people moving forward.", body: "Take a quick tour of the Wayvida HRMS experience, from everyday people operations to payroll, performance, and employee growth.", extra: "https://www.youtube.com/watch?v=" },
  { id: "modules", label: "Module showcase", enabled: true, title: "Module mapping by plan", body: "Explore the HRMS capabilities available across your subscription plans.", extra: "" },
  { id: "testimonials", label: "Client testimonials", enabled: true, title: "What our clients want to say", body: "See how growing teams use Wayvida to bring people, work, and learning into one connected workflow.", extra: "Priya K.|The employee portal gives everyone quick access to payslips, leave balances, and attendance without extra work for HR." },
  { id: "faq", label: "FAQs & enquiry", enabled: true, title: "FAQs", body: "Clear answers to help your team understand the platform, choose the right plan, and get started with confidence.", extra: "Send Enquiry|Our team will get in touch with you shortly." },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const initialTestimonials: Testimonial[] = [
  { id: "t1", name: "Priya K.", role: "HR Manager, Startup team", quote: "The employee portal gives everyone quick access to payslips, leave balances, and attendance without extra work for HR." },
  { id: "t2", name: "Dev V.", role: "Finance Lead, Services company", quote: "Moving our salary structures into one platform made month-end processing much more predictable." },
  { id: "t3", name: "Sana N.", role: "People Lead, Scaling business", quote: "Wayvida gives our managers a clear view of people operations while employees get a simpler daily experience." },
];
const initialFaqs: Faq[] = [
  { id: "f1", question: "What is an HRMS and why does my organization need it?", answer: "An HRMS centralizes employee information, attendance, leave, payroll, performance, and other HR processes." },
  { id: "f2", question: "Who can use this HRMS platform?", answer: "HR teams, managers, finance teams, and employees can use role-based parts of the platform." },
  { id: "f3", question: "What features are included in the HRMS subscription?", answer: "Included features depend on the modules mapped to the selected subscription plan." },
];

export function LandingBuilder({ plans, modules, onExit }: { plans: BuilderPlan[]; modules: BuilderModule[]; onExit: () => void }) {
  const [sections, setSections] = useState(defaults);
  const [selected, setSelected] = useState<SectionId>("hero");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dragged, setDragged] = useState<SectionId | null>(null);
  const [heroImage, setHeroImage] = useState("/employees-ui.png");
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [faqs, setFaqs] = useState(initialFaqs);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem("wayvida-landing-builder") || "null"); if (stored?.sections) setSections(stored.sections); if (stored?.heroImage) setHeroImage(stored.heroImage); if (stored?.testimonials) setTestimonials(stored.testimonials); if (stored?.faqs) setFaqs(stored.faqs); } catch { /* retain defaults */ }
  }, []);

  const current = sections.find((section) => section.id === selected) || sections[0];
  const update = (patch: Partial<PageSection>) => setSections((all) => all.map((section) => section.id === selected ? { ...section, ...patch } : section));
  const move = (id: SectionId, direction: -1 | 1) => setSections((all) => {
    const index = all.findIndex((section) => section.id === id); const target = index + direction;
    if (target < 0 || target >= all.length) return all;
    const next = [...all]; [next[index], next[target]] = [next[target], next[index]]; return next;
  });
  const drop = (targetId: SectionId) => {
    if (!dragged || dragged === targetId) return;
    setSections((all) => { const next = [...all]; const from = next.findIndex((s) => s.id === dragged); const to = next.findIndex((s) => s.id === targetId); const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
    setDragged(null);
  };
  const save = () => { localStorage.setItem("wayvida-landing-builder", JSON.stringify({ sections, heroImage, testimonials, faqs })); toast.success("Landing page published", { description: "Section order, visibility, and content have been saved." }); };
  const selectSection = (id: SectionId) => { setSelected(id); requestAnimationFrame(() => previewRef.current?.querySelector(`[data-preview-section="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const uploadHero = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setHeroImage(String(reader.result)); reader.readAsDataURL(file); };

  return <div className="builder-shell">
    <aside className="builder-controls">
      <header><div className="builder-title"><button onClick={onExit} aria-label="Back to subscriptions"><ArrowLeft /></button><div><h2>Landing page</h2><p>Arrange sections and edit their content.</p></div></div><Button size="sm" onClick={save}><Save />Publish</Button></header>
      <div className="section-list" aria-label="Landing page sections">
        {sections.map((section, index) => <article key={section.id} draggable onDragStart={() => setDragged(section.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(section.id)} className={`${selected === section.id ? "selected" : ""} ${!section.enabled ? "disabled" : ""}`} onClick={() => selectSection(section.id)}>
          <GripVertical className="drag" /><span className="section-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{section.label}</strong><small>{section.enabled ? "Visible" : "Hidden"}</small></div>
          <div className="section-actions"><button onClick={(e) => { e.stopPropagation(); move(section.id, -1); }} disabled={index === 0} aria-label="Move up"><ChevronUp /></button><button onClick={(e) => { e.stopPropagation(); move(section.id, 1); }} disabled={index === sections.length - 1} aria-label="Move down"><ChevronDown /></button><span className="section-toggle"><Switch checked={section.enabled} onCheckedChange={(enabled) => setSections((all) => all.map((item) => item.id === section.id ? { ...item, enabled } : item))} onClick={(e) => e.stopPropagation()} aria-label={`${section.label} visible`} /></span></div>
        </article>)}
      </div>
      <div className="section-editor">
        <div className="editor-title"><div><strong>{current.label}</strong><small>Content settings</small></div>{current.enabled ? <Eye /> : <EyeOff />}</div>
        <label>{current.id === "metrics" ? "Metric values (separate with |)" : "Heading"}<Input value={current.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label>{current.id === "metrics" ? "Metric labels (separate with |)" : "Supporting text"}<Textarea rows={4} value={current.body} onChange={(e) => update({ body: e.target.value })} /></label>
        {current.id !== "metrics" && current.id !== "modules" && <label>{fieldLabel(current.id)}<Input value={current.extra} onChange={(e) => update({ extra: e.target.value })} /></label>}
        {current.id === "hero" && <div className="asset-upload"><span>Hero image</span><label><Upload />Upload image<input type="file" accept="image/*" onChange={(e) => uploadHero(e.target.files?.[0])} /></label><Input value={heroImage.startsWith("data:") ? "Uploaded image" : heroImage} onChange={(e) => setHeroImage(e.target.value)} disabled={heroImage.startsWith("data:")} />{heroImage.startsWith("data:") && <button onClick={() => setHeroImage("/employees-ui.png")}>Use default image</button>}</div>}
        {current.id === "testimonials" && <RepeatEditor title="Testimonials" addLabel="Add testimonial" onAdd={() => setTestimonials((all) => [...all, { id: `t${Date.now()}`, name: "New customer", role: "Customer role", quote: "Add the customer testimonial here." }])}>{testimonials.map((item, index) => <div className="repeat-card" key={item.id}><header><b>Testimonial {index + 1}</b><button onClick={() => setTestimonials((all) => all.filter((entry) => entry.id !== item.id))}><Trash2 /></button></header><Input value={item.name} onChange={(e) => setTestimonials((all) => all.map((entry) => entry.id === item.id ? { ...entry, name: e.target.value } : entry))} placeholder="Customer name" /><Input value={item.role} onChange={(e) => setTestimonials((all) => all.map((entry) => entry.id === item.id ? { ...entry, role: e.target.value } : entry))} placeholder="Role and company" /><Textarea value={item.quote} onChange={(e) => setTestimonials((all) => all.map((entry) => entry.id === item.id ? { ...entry, quote: e.target.value } : entry))} placeholder="Testimonial" /></div>)}</RepeatEditor>}
        {current.id === "faq" && <RepeatEditor title="Questions and answers" addLabel="Add question" onAdd={() => setFaqs((all) => [...all, { id: `f${Date.now()}`, question: "New question", answer: "Add the answer here." }])}>{faqs.map((item, index) => <div className="repeat-card" key={item.id}><header><b>Question {index + 1}</b><button onClick={() => setFaqs((all) => all.filter((entry) => entry.id !== item.id))}><Trash2 /></button></header><Input value={item.question} onChange={(e) => setFaqs((all) => all.map((entry) => entry.id === item.id ? { ...entry, question: e.target.value } : entry))} /><Textarea value={item.answer} onChange={(e) => setFaqs((all) => all.map((entry) => entry.id === item.id ? { ...entry, answer: e.target.value } : entry))} /></div>)}</RepeatEditor>}
      </div>
    </aside>
    <section className="builder-preview">
      <header><div><Eye /><span>Live page preview</span><small>{sections.filter((s) => s.enabled).length} of {sections.length} sections visible</small></div><div className="device-switch"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop preview"><Monitor /></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile preview"><Smartphone /></button></div></header>
      <div className={`preview-canvas ${device}`} ref={previewRef}><div className="landing-page-preview">
        {sections.filter((section) => section.enabled).map((section) => <div key={section.id} data-preview-section={section.id}><PreviewSection section={section} plans={plans} modules={modules} heroImage={heroImage} testimonials={testimonials} faqs={faqs} /></div>)}
      </div></div>
    </section>
  </div>;
}

function fieldLabel(id: SectionId) { return id === "hero" ? "Eyebrow text" : id === "plans" ? "Pricing button label" : id === "walkthrough" ? "Video URL" : id === "testimonials" ? "Featured name and quote (separate with |)" : "Form heading and text (separate with |)"; }

function PreviewSection({ section, plans, modules, heroImage, testimonials, faqs }: { section: PageSection; plans: BuilderPlan[]; modules: BuilderModule[]; heroImage: string; testimonials: Testimonial[]; faqs: Faq[] }) {
  if (section.id === "hero") return <section className="lp-hero"><div className="lp-hero-copy"><em>{section.extra}</em><h1>{section.title}</h1><p>{section.body}</p><div className="lp-mini-stats"><span><b>{plans.length} Plans</b>Mapped to features</span><span><b>Per user</b>Pricing that scales</span><span><b>Fast demo</b>Easy lead capture</span></div><div className="lp-buttons"><button>Book a Demo</button><button>Compare Plans</button></div></div><div className="lp-product"><span>HRMS COMMAND CENTER</span><img src={heroImage} alt="HRMS hero visual" /><img src="/attendance-ui.png" alt="Attendance product screen" /></div></section>;
  if (section.id === "metrics") { const values = section.title.split("|"); const labels = section.body.split("|"); return <section className="lp-metrics">{values.map((value, index) => <div key={index}><b>{value}</b><span>{labels[index]}</span></div>)}</section>; }
  if (section.id === "plans") return <section className="lp-section lp-pricing"><div className="lp-heading"><div><h2>{section.title}</h2><p>{section.body}</p></div><button>{section.extra}</button></div><div className="lp-plan-grid">{plans.filter((p) => p.active).slice(0, 3).map((plan) => <article key={plan.id} className={plan.recommended ? "featured" : ""}>{plan.recommended && <mark>Most Popular</mark>}<h3>{plan.name}</h3><div className="lp-price"><b>{money(plan.price)}</b><span>/month billed annually</span></div><strong>For {plan.includedEmployees} employees ({money(plan.extraPrice)} per additional employee)</strong><p>{plan.description}</p><ul>{plan.modules.slice(0, 5).map((id) => <li key={id}><Check />{modules.find((m) => m.id === id)?.name}</li>)}</ul></article>)}</div></section>;
  if (section.id === "walkthrough") return <section className="lp-walkthrough"><div><small>HRMS walkthrough</small><h2>{section.title}</h2><p>{section.body}</p><ul><li><Check />Bring employee data and processes into one workspace</li><li><Check />Give managers real-time visibility</li><li><Check />Make every HR task simpler</li></ul></div><div className="lp-video"><header><b>Watch the HRMS walkthrough</b><span>Ready to watch</span></header><img src="/hrms-video-poster.png" alt="HRMS application walkthrough" /><button aria-label="Play walkthrough">▶</button></div></section>;
  if (section.id === "modules") return <section className="lp-section lp-modules"><h2>{section.title}</h2><p>{section.body}</p><div>{modules.filter((m) => m.active).slice(0, 7).map((module) => <article key={module.id}><b>{module.name}</b><span>{module.category} tools and controls.</span></article>)}</div></section>;
  if (section.id === "testimonials") return <section className="lp-testimonials"><h2>{section.title}</h2><p>{section.body}</p><div>{testimonials.map((item) => <article key={item.id}><span>★★★★★</span><blockquote>“{item.quote}”</blockquote><b>{item.name}</b><small>{item.role}</small></article>)}</div></section>;
  const [formTitle, formText] = section.extra.split("|");
  return <section className="lp-faq"><div><h2>{section.title}</h2><p>{section.body}</p>{faqs.map((item, i) => <details key={item.id} open={i === 0}><summary><b>{String(i + 1).padStart(2, "0")}</b><strong>{item.question}</strong><span>+</span></summary><p>{item.answer}</p></details>)}</div><form><h2>{formTitle}</h2><p>{formText}</p><label>Full name<input placeholder="Enter your full name" /></label><div><label>Phone number<input placeholder="+91 98765 43210" /></label><label>Email address<input placeholder="you@example.com" /></label></div><label>Preferred plan<select>{plans.filter((p) => p.active).map((p) => <option key={p.id}>{p.name}</option>)}</select></label><button type="button">Submit & Get Free Consultation</button></form></section>;
}

function RepeatEditor({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) { return <div className="repeat-editor"><header><strong>{title}</strong><Button size="sm" variant="outline" onClick={onAdd}><Plus />{addLabel}</Button></header><div>{children}</div></div>; }
