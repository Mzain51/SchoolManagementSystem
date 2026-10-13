"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { AcademicYear, SchoolClass, SchoolSection, SchoolSubject } from "@/types/api";

export default function AcademicSetupPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [yearRows, classRows, sectionRows, subjectRows] = await Promise.all([api.getAcademicYears(), api.getClasses(), api.getSections(), api.getSubjects()]);
    setYears(yearRows);
    setClasses(classRows);
    setSections(sectionRows);
    setSubjects(subjectRows);
  }, []);

  useEffect(() => { void refresh().catch((e: unknown) => setError(errorText(e))); }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>, kind: "year" | "class" | "section" | "subject") {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (kind === "year") {
        await api.createAcademicYear({
          name: String(data.get("name")).trim(),
          start_date: String(data.get("start_date")),
          end_date: String(data.get("end_date")),
          is_active: data.get("is_active") === "on",
        });
      } else if (kind === "class") {
        await api.createClass({ academic_year_id: String(data.get("academic_year_id")), name: String(data.get("name")).trim(), sort_order: Number(data.get("sort_order") || 0) });
      } else if (kind === "section") {
        const capacity = String(data.get("capacity"));
        await api.createSection({ class_id: String(data.get("class_id")), name: String(data.get("name")).trim(), capacity: capacity ? Number(capacity) : null });
      } else {
        await api.createSubject({ academic_year_id: String(data.get("academic_year_id")), name: String(data.get("name")).trim(), code: String(data.get("code")).trim().toUpperCase() });
      }
      form.reset();
      await refresh();
      setMessage(kind === "year" ? "Academic year created." : kind === "class" ? "Class created." : kind === "section" ? "Section created." : "Subject created.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">School configuration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Academic setup</h1><p className="mt-1 text-sm text-slate-500">Create the academic year, classes, and sections used by student enrollment.</p></header>
    {error && <div role="alert" className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {message && <div role="status" className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section id="years" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Academic years</h2><p className="mt-1 text-xs text-slate-500">Define the school year and optionally make it the active enrollment year.</p><form onSubmit={(e) => void submit(e, "year")} className="mt-4 space-y-3">
        <Input name="name" label="Year name" placeholder="2026–2027" required /><div className="grid grid-cols-2 gap-3"><Input name="start_date" label="Starts" type="date" required /><Input name="end_date" label="Ends" type="date" required /></div><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="is_active" className="rounded border-slate-300 text-blue-600" /> Set as active year</label><Submit busy={busy}>Add academic year</Submit>
      </form><ul className="mt-5 divide-y divide-slate-100">{years.map((year) => <li key={year.id} className="flex items-center justify-between py-2.5 text-sm"><span className="font-medium text-slate-700">{year.name}</span><span className="text-xs text-slate-500">{year.start_date} – {year.end_date}{year.is_active ? " · Active" : ""}</span></li>)}</ul></section>
      <section id="classes" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Classes</h2><p className="mt-1 text-xs text-slate-500">Class names are configurable for each academic year.</p><form onSubmit={(e) => void submit(e, "class")} className="mt-4 space-y-3"><Select name="academic_year_id" label="Academic year" required options={years.map((y) => [y.id, y.name])} /><div className="grid grid-cols-[1fr_7rem] gap-3"><Input name="name" label="Class name" placeholder="Grade 1" required /><Input name="sort_order" label="Order" type="number" min="0" defaultValue="0" /></div><Submit busy={busy} disabled={!years.length}>Add class</Submit></form><ul className="mt-5 divide-y divide-slate-100">{classes.map((item) => <li key={item.id} className="flex items-center justify-between py-2.5 text-sm"><span className="font-medium text-slate-700">{item.name}</span><span className="text-xs text-slate-500">{years.find((y) => y.id === item.academic_year_id)?.name}</span></li>)}</ul></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Sections</h2><p className="mt-1 text-xs text-slate-500">Add sections such as A or B under a class.</p><form onSubmit={(e) => void submit(e, "section")} className="mt-4 space-y-3"><Select name="class_id" label="Class" required options={classes.map((c) => [c.id, `${c.name} · ${years.find((y) => y.id === c.academic_year_id)?.name ?? ""}`])} /><div className="grid grid-cols-2 gap-3"><Input name="name" label="Section name" placeholder="A" required /><Input name="capacity" label="Capacity (optional)" type="number" min="1" /></div><Submit busy={busy} disabled={!classes.length}>Add section</Submit></form><ul className="mt-5 divide-y divide-slate-100">{sections.map((section) => <li key={section.id} className="py-2.5 text-sm font-medium text-slate-700">{classes.find((c) => c.id === section.class_id)?.name} · Section {section.name}</li>)}</ul></section>
      <section id="subjects" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Subjects</h2><p className="mt-1 text-xs text-slate-500">Configure the school subjects for an academic year.</p><form onSubmit={(e) => void submit(e, "subject")} className="mt-4 space-y-3"><Select name="academic_year_id" label="Academic year" required options={years.map((y) => [y.id, y.name])} /><div className="grid grid-cols-2 gap-3"><Input name="name" label="Subject name" placeholder="Mathematics" required /><Input name="code" label="Subject code" placeholder="MATH-01" required /></div><Submit busy={busy} disabled={!years.length}>Add subject</Submit></form><ul className="mt-5 divide-y divide-slate-100">{subjects.map((subject) => <li key={subject.id} className="flex justify-between py-2.5 text-sm"><span className="font-medium text-slate-700">{subject.name}</span><span className="font-mono text-xs text-slate-500">{subject.code}</span></li>)}</ul></section>
      <aside className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5"><h2 className="font-semibold text-blue-950">How this connects</h2><p className="mt-2 text-sm leading-6 text-blue-900/80">These records are saved through the FastAPI academic endpoints. Student registration then stores foreign keys to the selected academic year, class, and section, so the school roster stays consistent as the setup changes.</p><a href="/students" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Go to students</a></aside>
    </div>
  </div>;
}

function errorText(error: unknown) { return error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Something went wrong. Please try again."; }

function Input({ name, label, type = "text", required = false, placeholder, min, defaultValue }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string; min?: string; defaultValue?: string }) {
  return <label className="block text-xs font-medium text-slate-700">{label}<input name={name} type={type} required={required} placeholder={placeholder} min={min} defaultValue={defaultValue} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>;
}

function Select({ name, label, options, required = false }: { name: string; label: string; options: [string, string][]; required?: boolean }) {
  return <label className="block text-xs font-medium text-slate-700">{label}<select name={name} required={required} defaultValue="" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"><option value="">Select {label.toLowerCase()}</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}

function Submit({ busy, disabled = false, children }: { busy: boolean; disabled?: boolean; children: string }) {
  return <button disabled={busy || disabled} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{children}</button>;
}
