'use client';
import React, { useMemo, useState } from "react";

// ---- CONFIG ----
// If you already have a backend endpoint, set it here. If empty, we'll fallback to a mailto: draft.
const FORM_ENDPOINT = ""; // e.g., "/api/therapists" or "https://formspree.io/f/xxxxxx"
const NOTIFY_EMAIL = "mrusinol@troposferica.com"; // fallback recipient for mailto

// ---- I18N ----
const I18N = {
  es: {
    langName: "ES",
    metaTitle: "Psicofinders · Alta de profesionales",
    heroTitle: "Únete a Psicofinders",
    heroSubtitle:
      "Recibe pacientes que encajen con tu perfil y disponibilidad. Verificamos colegiación y priorizamos el ajuste ético y logístico.",
    cta: "Quiero apuntarme",
    features: [
      { title: "Leads cualificados", desc: "Usuarios filtrados por idioma, modalidad y rango de honorarios." },
      { title: "Verificación", desc: "Validación de colegiación y póliza de RC para mayor confianza." },
      { title: "Control", desc: "Tú decides tu visibilidad, especialidades y horarios." },
    ],
    formTitle: "Formulario de alta",
    required: "(obligatorio)",
    labels: {
      name: "Nombre y apellidos",
      email: "Email profesional",
      phone: "Teléfono (opcional)",
      city: "Ciudad / Provincia",
      country: "País",
      colegiado: "Nº de colegiación (COP)",
      experience: "Años de experiencia",
      website: "Web o LinkedIn (opcional)",
      modality: "Modalidad de atención",
      modalities: { inperson: "Presencial", online: "Online", hybrid: "Híbrida" },
      langs: "Idiomas de atención",
      approaches: "Enfoques terapéuticos",
      specialties: "Especialidades",
      price: "Precio por sesión (€)",
      priceMin: "Mínimo",
      priceMax: "Máximo",
      availability: "Disponibilidad semanal",
      days: {
        mon: "Lunes",
        tue: "Martes",
        wed: "Miércoles",
        thu: "Jueves",
        fri: "Viernes",
        sat: "Sábado",
        sun: "Domingo",
      },
      timeFrom: "Desde",
      timeTo: "Hasta",
      notes: "Notas (opcional)",
      consent: "He leído y acepto la Política de Privacidad",
      nonEmergency:
        "Psicofinders no presta servicios de emergencia ni realiza diagnóstico clínico. En caso de urgencia, llama al 112.",
      submit: "Enviar solicitud",
      success: "¡Gracias! Hemos recibido tu solicitud.",
      error: "Error al enviar. Revisa los campos o inténtalo de nuevo.",
      privacy: "Política de Privacidad",
    },
  },
  ca: {
    langName: "CA",
    metaTitle: "Psicofinders · Alta de professionals",
    heroTitle: "Uneix-te a Psicofinders",
    heroSubtitle:
      "Rep pacients que encaixin amb el teu perfil i disponibilitat. Verifiquem col·legiació i prioritzem l'ajust ètic i logístic.",
    cta: "Vull inscriure'm",
    features: [
      { title: "Leads qualificats", desc: "Usuaris filtrats per idioma, modalitat i honoraris." },
      { title: "Verificació", desc: "Validació de col·legiació i pòlissa de RC per a més confiança." },
      { title: "Control", desc: "Tu decideixes visibilitat, especialitats i horaris." },
    ],
    formTitle: "Formulari d'alta",
    required: "(obligatori)",
    labels: {
      name: "Nom i cognoms",
      email: "Email professional",
      phone: "Telèfon (opcional)",
      city: "Ciutat / Província",
      country: "País",
      colegiado: "Núm. de col·legiació (COP)",
      experience: "Anys d'experiència",
      website: "Web o LinkedIn (opcional)",
      modality: "Modalitat d'atenció",
      modalities: { inperson: "Presencial", online: "En línia", hybrid: "Híbrida" },
      langs: "Idiomes d'atenció",
      approaches: "Enfocs terapèutics",
      specialties: "Especialitats",
      price: "Preu per sessió (€)",
      priceMin: "Mínim",
      priceMax: "Màxim",
      availability: "Disponibilitat setmanal",
      days: {
        mon: "Dilluns",
        tue: "Dimarts",
        wed: "Dimecres",
        thu: "Dijous",
        fri: "Divendres",
        sat: "Dissabte",
        sun: "Diumenge",
      },
      timeFrom: "Des de",
      timeTo: "Fins a",
      notes: "Notes (opcional)",
      consent: "He llegit i accepto la Política de Privacitat",
      nonEmergency:
        "Psicofinders no presta serveis d'emergència ni fa diagnòstic clínic. En cas d'urgència, truca al 112.",
      submit: "Enviar sol·licitud",
      success: "Gràcies! Hem rebut la teva sol·licitud.",
      error: "Error en l'enviament. Revisa els camps o torna-ho a provar.",
      privacy: "Política de Privacitat",
    },
  },
  en: {
    langName: "EN",
    metaTitle: "Psicofinders · Therapist sign‑up",
    heroTitle: "Join Psicofinders",
    heroSubtitle:
      "Receive patients who match your profile and availability. We verify licensing and prioritize ethical, logistical fit.",
    cta: "Apply now",
    features: [
      { title: "Qualified leads", desc: "Users filtered by language, modality and fee range." },
      { title: "Verification", desc: "License and liability insurance validation." },
      { title: "Control", desc: "You decide visibility, specialties and schedule." },
    ],
    formTitle: "Sign‑up form",
    required: "(required)",
    labels: {
      name: "Full name",
      email: "Professional email",
      phone: "Phone (optional)",
      city: "City / State/Province",
      country: "Country",
      colegiado: "License / Registration #",
      experience: "Years of experience",
      website: "Website or LinkedIn (optional)",
      modality: "Care modality",
      modalities: { inperson: "In‑person", online: "Online", hybrid: "Hybrid" },
      langs: "Languages",
      approaches: "Therapeutic approaches",
      specialties: "Specialties",
      price: "Fee per session (€)",
      priceMin: "Min",
      priceMax: "Max",
      availability: "Weekly availability",
      days: {
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sun: "Sunday",
      },
      timeFrom: "From",
      timeTo: "To",
      notes: "Notes (optional)",
      consent: "I have read and accept the Privacy Policy",
      nonEmergency:
        "Psicofinders does not provide emergency services or clinical diagnosis. In case of emergency, call 112.",
      submit: "Submit application",
      success: "Thanks! We've received your application.",
      error: "Submission error. Check fields or try again.",
      privacy: "Privacy Policy",
    },
  },
  fr: {
    langName: "FR",
    metaTitle: "Psicofinders · Inscription professionnels",
    heroTitle: "Rejoindre Psicofinders",
    heroSubtitle:
      "Recevez des patient·e·s correspondant à votre profil et à vos disponibilités. Licence vérifiée et adéquation éthique/logistique priorisées.",
    cta: "Je m'inscris",
    features: [
      { title: "Leads qualifiés", desc: "Utilisateurs filtrés par langue, modalité et budget." },
      { title: "Vérification", desc: "Validation du numéro d'inscription et assurance RC." },
      { title: "Contrôle", desc: "Vous décidez visibilité, spécialités et horaires." },
    ],
    formTitle: "Formulaire d'inscription",
    required: "(obligatoire)",
    labels: {
      name: "Nom et prénom",
      email: "Email professionnel",
      phone: "Téléphone (optionnel)",
      city: "Ville / Département/Province",
      country: "Pays",
      colegiado: "N° d'inscription/licence",
      experience: "Années d'expérience",
      website: "Site web ou LinkedIn (optionnel)",
      modality: "Modalité de prise en charge",
      modalities: { inperson: "Présentiel", online: "En ligne", hybrid: "Hybride" },
      langs: "Langues",
      approaches: "Approches thérapeutiques",
      specialties: "Spécialités",
      price: "Tarif par séance (€)",
      priceMin: "Min",
      priceMax: "Max",
      availability: "Disponibilités hebdomadaires",
      days: {
        mon: "Lundi",
        tue: "Mardi",
        wed: "Mercredi",
        thu: "Jeudi",
        fri: "Vendredi",
        sat: "Samedi",
        sun: "Dimanche",
      },
      timeFrom: "De",
      timeTo: "À",
      notes: "Notes (optionnel)",
      consent: "J'ai lu et j'accepte la Politique de Confidentialité",
      nonEmergency:
        "Psicofinders ne fournit pas de services d'urgence ni de diagnostic clinique. En cas d'urgence, appelez le 112.",
      submit: "Envoyer la demande",
      success: "Merci ! Nous avons bien reçu votre demande.",
      error: "Erreur d'envoi. Vérifiez les champs ou réessayez.",
      privacy: "Politique de Confidentialité",
    },
  },
};

// ---- Options ----
const APPROACHES = ["TCC", "EMDR", "ACT", "Sistémica", "Psicodinámica", "Humanista", "Gestalt", "Mindfulness"];
const SPECIALTIES = [
  "Ansiedad",
  "Estado de ánimo / Depresión",
  "Trauma",
  "Pareja / Familia",
  "Infanto‑juvenil",
  "Adicciones",
  "Duelo",
  "TDAH",
  "Identidad / Diversidad",
  "Estrés laboral",
];

const LANGS = [
  { key: "es", label: "ES" },
  { key: "ca", label: "CA" },
  { key: "en", label: "EN" },
  { key: "fr", label: "FR" },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border px-3 py-1 text-sm">
      {children}
    </span>
  );
}

function Checkbox({ checked, onChange, id, label }: any) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Input({ label, required, ...props }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        {...props}
        className="rounded-xl border px-3 py-2 focus:outline-none focus:ring"
      />
    </div>
  );
}

function Select({ label, required, children, ...props }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <select {...props} className="rounded-xl border px-3 py-2 focus:outline-none focus:ring">
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, required, ...props }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <textarea
        {...props}
        className="min-h-[90px] rounded-xl border px-3 py-2 focus:outline-none focus:ring"
      />
    </div>
  );
}

export default function TherapistSignupLanding() {
  const [uiLang, setUiLang] = useState<"es" | "ca" | "en" | "fr">("es");
  const t = I18N[uiLang];

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "España",
    colegiado: "",
    experience: "",
    website: "",
    modality: "inperson",
    langs: ["es"],
    approaches: [] as string[],
    specialties: [] as string[],
    priceMin: "",
    priceMax: "",
    availability: {
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false,
      sun: false,
      from: "09:00",
      to: "19:00",
    },
    notes: "",
    consent: false,
    honey: "", // honeypot
  });

  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const handleChange = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleArray = (key: "approaches" | "specialties" | "langs", value: string) => {
    setForm((f) => {
      const arr = new Set(f[key]);
      if (arr.has(value)) arr.delete(value);
      else arr.add(value);
      return { ...f, [key]: Array.from(arr) } as any;
    });
  };

  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

  const isValid = useMemo(() => {
    if (!form.name || !form.email || !form.city || !form.country || !form.colegiado) return false;
    if (!form.consent) return false;
    if (!form.langs.length) return false;
    if (form.honey) return false; // bot
    return true;
  }, [form]);

  const payload = useMemo(() => ({
    ...form,
    submittedAtISO: new Date().toISOString(),
    uiLang,
    source: "landing-pro-mvp",
  }), [form, uiLang]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Bad response");
        setStatus("ok");
        (e.target as HTMLFormElement).reset();
        return;
      }
      // Fallback: open a mail draft with JSON content (shortened)
      const summary = encodeURIComponent(
        [
          `Nombre: ${form.name}`,
          `Email: ${form.email}`,
          `Teléfono: ${form.phone || "-"}`,
          `Ciudad/País: ${form.city}, ${form.country}`,
          `Colegiación: ${form.colegiado}`,
          `Experiencia: ${form.experience || "-"}`,
          `Modalidad: ${form.modality}`,
          `Idiomas: ${form.langs.join(", ")}`,
          `Enfoques: ${form.approaches.join(", ") || "-"}`,
          `Especialidades: ${form.specialties.join(", ") || "-"}`,
          `Precio: ${form.priceMin || "?"}–${form.priceMax || "?"} €`,
          `Disponibilidad: ${dayKeys
            .filter((d) => (form.availability as any)[d])
            .map((d) => d)
            .join(", ")} ${form.availability.from}-${form.availability.to}`,
          `Notas: ${form.notes || "-"}`,
        ].join("\n")
      );
      const mailto = `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent(
        "Alta profesional Psicofinders"
      )}&body=${summary}`;
      window.location.href = mailto;
      setStatus("ok");
    } catch (err) {
      console.error(err);
      setStatus("err");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* NAV */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white font-bold">P</div>
          <span className="text-lg font-semibold">Psicofinders</span>
          <span className="ml-3 hidden items-center gap-2 sm:flex">
            <Badge>Leads</Badge>
            <Badge>Verificación</Badge>
            <Badge>Control</Badge>
          </span>
        </div>
        {/* Language switcher in ES → CA → EN → FR order */}
        <div className="flex items-center gap-2">
          {(["es", "ca", "en", "fr"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setUiLang(k)}
              className={`rounded-full border px-3 py-1 text-sm ${
                uiLang === k ? "bg-gray-900 text-white" : "bg-white"
              }`}
            >
              {I18N[k].langName}
            </button>
          ))}
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{t.heroTitle}</h1>
          <p className="mt-4 text-lg text-gray-700">{t.heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {t.features.map((f, i) => (
              <div key={i} className="rounded-2xl border bg-white p-3 shadow-sm">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-sm text-gray-600">{f.desc}</div>
              </div>
            ))}
          </div>
          <a href="#form" className="mt-8 inline-block rounded-2xl bg-black px-6 py-3 text-white">{t.cta}</a>
        </div>
        <div className="order-first md:order-last">
          <div className="rounded-3xl border bg-white p-6 shadow-md">
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.slice(0, 6).map((s) => (
                <div key={s} className="rounded-xl bg-gray-50 p-3 text-sm">{s}</div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-gray-900 p-4 text-white">
              <div className="text-sm opacity-90">Match de ejemplo</div>
              <div className="mt-1 text-xl font-semibold">Paciente · Ansiedad · ES/CA · Online</div>
              <div className="mt-2 text-sm opacity-80">Ventana horaria: 18:00–20:00 (Europe/Madrid)</div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="form" className="mx-auto w-full max-w-5xl rounded-3xl border bg-white px-4 py-8 shadow-sm md:px-8">
        <h2 className="text-2xl font-bold">{t.formTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.labels.nonEmergency}</p>

        <form className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <input
            type="text"
            autoComplete="off"
            value={form.honey}
            onChange={(e) => handleChange("honey", e.target.value)}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          <Input
            label={`${t.labels.name} ${t.required}`}
            required
            placeholder="María López"
            value={form.name}
            onChange={(e: any) => handleChange("name", e.target.value)}
          />

          <Input
            label={`${t.labels.email} ${t.required}`}
            required
            type="email"
            placeholder="nombre@clinica.com"
            value={form.email}
            onChange={(e: any) => handleChange("email", e.target.value)}
          />

          <Input
            label={t.labels.phone}
            type="tel"
            placeholder="+34 6XX XX XX XX"
            value={form.phone}
            onChange={(e: any) => handleChange("phone", e.target.value)}
          />

          <Input
            label={`${t.labels.city} ${t.required}`}
            required
            placeholder="Barcelona"
            value={form.city}
            onChange={(e: any) => handleChange("city", e.target.value)}
          />

          <Input
            label={`${t.labels.country} ${t.required}`}
            required
            placeholder="España"
            value={form.country}
            onChange={(e: any) => handleChange("country", e.target.value)}
          />

          <Input
            label={`${t.labels.colegiado} ${t.required}`}
            required
            placeholder="COPC XXXXX"
            value={form.colegiado}
            onChange={(e: any) => handleChange("colegiado", e.target.value)}
          />

          <Input
            label={t.labels.experience}
            type="number"
            min={0}
            placeholder="5"
            value={form.experience}
            onChange={(e: any) => handleChange("experience", e.target.value)}
          />

          <Input
            label={t.labels.website}
            placeholder="https://…"
            value={form.website}
            onChange={(e: any) => handleChange("website", e.target.value)}
          />

          <Select
            label={`${t.labels.modality} ${t.required}`}
            required
            value={form.modality}
            onChange={(e: any) => handleChange("modality", e.target.value)}
          >
            <option value="inperson">{t.labels.modalities.inperson}</option>
            <option value="online">{t.labels.modalities.online}</option>
            <option value="hybrid">{t.labels.modalities.hybrid}</option>
          </Select>

          {/* Languages */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">{t.labels.langs} <span className="text-red-600">*</span></label>
            <div className="mt-2 flex flex-wrap gap-3">
              {LANGS.map(({ key, label }) => (
                <Checkbox
                  key={key}
                  id={`lang-${key}`}
                  label={label}
                  checked={form.langs.includes(key)}
                  onChange={(v: boolean) => toggleArray("langs", key)}
                />
              ))}
            </div>
          </div>

          {/* Approaches */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">{t.labels.approaches}</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {APPROACHES.map((a) => (
                <Checkbox
                  key={a}
                  id={`ap-${a}`}
                  label={a}
                  checked={form.approaches.includes(a)}
                  onChange={() => toggleArray("approaches", a)}
                />
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">{t.labels.specialties}</label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SPECIALTIES.map((s) => (
                <Checkbox
                  key={s}
                  id={`sp-${s}`}
                  label={s}
                  checked={form.specialties.includes(s)}
                  onChange={() => toggleArray("specialties", s)}
                />
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`${t.labels.price} — ${t.labels.priceMin}`}
              type="number"
              min={0}
              placeholder="40"
              value={form.priceMin}
              onChange={(e: any) => handleChange("priceMin", e.target.value)}
            />
            <Input
              label={`${t.labels.price} — ${t.labels.priceMax}`}
              type="number"
              min={0}
              placeholder="90"
              value={form.priceMax}
              onChange={(e: any) => handleChange("priceMax", e.target.value)}
            />
          </div>

          {/* Availability */}
          <div className="col-span-1 md:col-span-2 rounded-2xl border p-4">
            <div className="text-sm font-medium">{t.labels.availability}</div>
            <div className="mt-3 flex flex-wrap gap-4">
              {dayKeys.map((d) => (
                <Checkbox
                  key={d}
                  id={`day-${d}`}
                  label={(t.labels.days as any)[d]}
                  checked={(form.availability as any)[d]}
                  onChange={(v: boolean) =>
                    setForm((f) => ({
                      ...f,
                      availability: { ...(f.availability as any), [d]: v },
                    }))
                  }
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={t.labels.timeFrom}
                type="time"
                value={form.availability.from}
                onChange={(e: any) =>
                  setForm((f) => ({
                    ...f,
                    availability: { ...(f.availability as any), from: e.target.value },
                  }))
                }
              />
              <Input
                label={t.labels.timeTo}
                type="time"
                value={form.availability.to}
                onChange={(e: any) =>
                  setForm((f) => ({
                    ...f,
                    availability: { ...(f.availability as any), to: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <Textarea
            className="md:col-span-2"
            label={t.labels.notes}
            placeholder="Breve presentación, preferencias de casos, etc."
            value={form.notes}
            onChange={(e: any) => handleChange("notes", e.target.value)}
          />

          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <input
                id="consent"
                type="checkbox"
                className="mt-1"
                checked={form.consent}
                onChange={(e) => handleChange("consent", e.target.checked)}
              />
              <label htmlFor="consent" className="text-sm">
                {t.labels.consent} · <a href="#" className="underline">{t.labels.privacy}</a>
              </label>
            </div>
            <p className="text-xs text-gray-500">GDPR/LOPDGDD: minimización de datos; cifrado en tránsito; eliminación bajo solicitud.</p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full rounded-2xl px-6 py-3 text-white transition ${
                isValid ? "bg-black hover:opacity-90" : "bg-gray-400"
              }`}
            >
              {t.labels.submit}
            </button>
            {status === "ok" && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-green-900">
                {t.labels.success}
              </div>
            )}
            {status === "err" && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
                {t.labels.error}
              </div>
            )}
          </div>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto mt-10 w-full max-w-6xl px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Psicofinders</div>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="underline">{t.labels.privacy}</a>
            <a href="#" className="underline">Terms</a>
            <span className="opacity-75">Europe/Madrid</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
