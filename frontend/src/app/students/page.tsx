"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { AcademicYear, SchoolClass, SchoolSection, Student, StudentInput, StudentStatus } from "@/types/api";

const statusLabel: Record<StudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  transferred: "Transferred",
  graduated: "Graduated",
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [formYearId, setFormYearId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) setQuery(initialQuery);
    Promise.all([api.getAcademicYears(), api.getClasses(), api.getSections()]).then(([yearRows, classRows, sectionRows]) => {
      if (cancelled) return;
      setYears(yearRows);
      setClasses(classRows);
      setSections(sectionRows);
    }).catch((e: unknown) => {
      if (!cancelled) setError(errorMessage(e));
    });
    return () => { cancelled = true; };
  }, []);

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (classFilter) params.set("class_id", classFilter);
    try {
      const response = await api.getStudents(params, signal);
      setStudents(response.items);
      setTotal(response.total);
    } catch (e) {
      if (!signal?.aborted) setError(errorMessage(e));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [classFilter, page, pageSize, query, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadStudents(controller.signal), query ? 250 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadStudents]);

  async function openStudent(student: Student) {
    setFormError(null);
    setSelected(student);
    setFormYearId(student.academic_year_id);
    setFormClassId(student.class_id);
    setFormOpen(true);
    try {
      const [fresh, allSections] = await Promise.all([api.getStudent(student.id), api.getSections()]);
      setSelected(fresh);
      setSections(allSections);
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  async function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: StudentInput = {
      academic_year_id: String(data.get("academic_year_id")),
      class_id: String(data.get("class_id")),
      section_id: String(data.get("section_id")),
      admission_number: String(data.get("admission_number")).trim(),
      full_name: String(data.get("full_name")).trim(),
      date_of_birth: String(data.get("date_of_birth")) || null,
      gender: (String(data.get("gender")) || null) as StudentInput["gender"],
      admission_date: String(data.get("admission_date")),
      guardian_name: String(data.get("guardian_name")).trim(),
      guardian_relationship: String(data.get("guardian_relationship")).trim() || undefined,
      guardian_phone: String(data.get("guardian_phone")).trim(),
      address: String(data.get("address")).trim() || undefined,
      previous_school: String(data.get("previous_school")).trim() || undefined,
      emergency_contact: String(data.get("emergency_contact")).trim() || undefined,
      status: (String(data.get("status") || "active")) as StudentStatus,
    };
    setSaving(true);
    setFormError(null);
    try {
      const saved = selected
        ? await api.updateStudent(selected.id, input)
        : await api.createStudent(input);
      setSelected(saved);
      setFormOpen(false);
      setSelected(null);
      await loadStudents();
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Academic management</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-500">Search and manage student records for your active school.</p>
        </div>
        <button onClick={() => { setSelected(null); setFormYearId(years.find((y) => y.is_active)?.id ?? years[0]?.id ?? ""); setFormClassId(""); setFormError(null); setFormOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Register student
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, admission number, guardian phone" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
            <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className="min-w-36 bg-transparent py-2.5 text-sm text-slate-700 outline-none">
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400">
            <option value="">All statuses</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span><button onClick={() => void loadStudents()} className="ml-auto font-semibold underline">Retry</button></div>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Admission no.</th><th className="px-4 py-3 font-semibold">Class / section</th><th className="px-4 py-3 font-semibold">Guardian</th><th className="px-4 py-3 font-semibold">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={5} className="py-16 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-600" />Loading student records…</td></tr>}
              {!loading && !error && students.map((student) => (
                <tr key={student.id} onClick={() => void openStudent(student)} className="cursor-pointer transition hover:bg-blue-50/40">
                  <td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"><UserRound className="h-4 w-4" /></span><span className="font-semibold text-slate-800">{student.full_name}</span></div></td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{student.admission_number}</td>
                  <td className="px-4 py-3.5 text-slate-600">{student.class_name} · {student.section_name}</td>
                  <td className="px-4 py-3.5"><div className="text-slate-700">{student.guardian_name}</div><div className="text-xs text-slate-500">{student.guardian_phone}</div></td>
                  <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${student.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel[student.status]}</span></td>
                </tr>
              ))}
              {!loading && !error && students.length === 0 && <tr><td colSpan={5} className="px-4 py-16 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound className="h-5 w-5" /></div><h2 className="mt-3 font-semibold text-slate-800">{query || status || classFilter ? "No matching students" : "No students yet"}</h2><p className="mt-1 text-sm text-slate-500">Register a student to start building this school’s roster.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{total} student{total === 1 ? "" : "s"}</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
      </section>

      {formOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) { setFormOpen(false); setSelected(null); } }}>
        <section role="dialog" aria-modal="true" aria-labelledby="student-form-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6"><div><h2 id="student-form-title" className="font-bold text-slate-900">{selected ? "Student profile" : "Register student"}</h2><p className="mt-0.5 text-xs text-slate-500">Student records are kept within the selected school.</p></div><button aria-label="Close" onClick={() => { setFormOpen(false); setSelected(null); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
          <form onSubmit={submitStudent} className="space-y-5 p-5 sm:p-6">
            {formError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{formError}</div>}
            {years.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Create an academic year, class, and section in <a className="font-semibold underline" href="/academic-setup">Academic Setup</a> before registering students.</div>}
            <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Student details</h3><div className="grid gap-3 sm:grid-cols-2">
              <Field name="full_name" label="Full name" required value={selected?.full_name} />
              <Field name="admission_number" label="Admission number" required value={selected?.admission_number} />
              <Field name="admission_date" label="Admission date" type="date" required value={selected?.admission_date} />
              <Field name="date_of_birth" label="Date of birth" type="date" value={selected?.date_of_birth ?? undefined} />
              <SelectField name="gender" label="Gender" value={selected?.gender ?? ""} options={[["", "Not specified"], ["female", "Female"], ["male", "Male"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"]]} />
              <SelectField name="status" label="Enrollment status" value={selected?.status ?? "active"} options={Object.entries(statusLabel)} />
            </div></div>
            <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Enrollment</h3><div className="grid gap-3 sm:grid-cols-3">
              <SelectField name="academic_year_id" label="Academic year" required value={formYearId} options={years.map((y) => [y.id, y.name])} onChange={(value) => { setFormYearId(value); setFormClassId(""); }} />
              <SelectField name="class_id" label="Class" required value={formClassId} options={classes.filter((c) => c.academic_year_id === formYearId).map((c) => [c.id, c.name])} onChange={setFormClassId} />
              <SelectField name="section_id" label="Section" required value={selected?.class_id === formClassId ? selected.section_id : ""} options={sections.filter((s) => s.class_id === formClassId).map((s) => [s.id, s.name])} />
            </div><p className="mt-2 text-xs text-slate-500">Manage academic years, classes, and sections from <a href="/academic-setup" className="font-medium text-blue-600 hover:underline">Academic Setup</a>.</p></div>
            <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Parent / guardian</h3><div className="grid gap-3 sm:grid-cols-2">
              <Field name="guardian_name" label="Guardian name" required value={selected?.guardian_name} />
              <Field name="guardian_relationship" label="Relationship" value={selected?.guardian_relationship ?? undefined} />
              <Field name="guardian_phone" label="Phone number" type="tel" required value={selected?.guardian_phone} />
              <Field name="emergency_contact" label="Emergency contact" type="tel" value={selected?.emergency_contact ?? undefined} />
              <Field name="address" label="Address" value={selected?.address ?? undefined} />
              <Field name="previous_school" label="Previous school" value={selected?.previous_school ?? undefined} />
            </div></div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setFormOpen(false); setSelected(null); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving || years.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{selected ? "Save changes" : "Create student"}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}

function Field({ name, label, type = "text", required = false, value }: { name: string; label: string; type?: string; required?: boolean; value?: string }) {
  return <label className="block text-xs font-medium text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}<input name={name} type={type} required={required} defaultValue={value} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>;
}

function SelectField({ name, label, value, options, required = false, onChange }: { name: string; label: string; value: string; options: [string, string][]; required?: boolean; onChange?: (value: string) => void }) {
  return <label className="block text-xs font-medium text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}<select key={`${name}-${value}`} name={name} required={required} {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue: value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="">Select {label.toLowerCase()}</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
