"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_RATES_MA,
  computeTco,
  formatMAD,
  quote,
  type FinancingInput,
} from "@/lib/financing";
import { catalog, type CatalogModel } from "@/lib/catalog";
import { onFinancingUpdate } from "@/lib/rihla-actions";

const TERMS: Array<FinancingInput["termMonths"]> = [36, 48, 60, 72];

export function FinancingAdvisor() {
  const [modelSlug, setModelSlug] = useState<string>(catalog[0]?.slug ?? "c3");
  const [downPayment, setDownPayment] = useState(50_000);
  const [tradeIn, setTradeIn] = useState(0);
  const [term, setTerm] = useState<FinancingInput["termMonths"]>(60);
  const [annualKm, setAnnualKm] = useState(15_000);

  useEffect(() => {
    return onFinancingUpdate((u) => {
      if (u.modelSlug) {
        const match = catalog.find((m) => m.slug === u.modelSlug);
        if (match) setModelSlug(match.slug);
      }
      if (typeof u.downPayment === "number") setDownPayment(u.downPayment);
      if (typeof u.termMonths === "number") {
        const closest = TERMS.reduce((a, b) => Math.abs(b - u.termMonths!) < Math.abs(a - u.termMonths!) ? b : a);
        setTerm(closest);
      }
      if (typeof u.tradeIn === "number") setTradeIn(u.tradeIn);
    });
  }, []);

  const model: CatalogModel =
    catalog.find((m) => m.slug === modelSlug) ?? catalog[0]!;

  const quotes = useMemo(() => {
    const base = {
      vehiclePrice: model.priceFrom,
      downPayment,
      tradeInValue: tradeIn,
      termMonths: term,
    };
    return [
      {
        label: "Prêt bancaire partenaire",
        sub: "Attijariwafa · BOA · CIH",
        q: quote({ ...base, annualRatePct: DEFAULT_RATES_MA.bankLoan }),
      },
      {
        label: "Citroën Finance",
        sub: "Offre constructeur",
        q: quote({ ...base, annualRatePct: DEFAULT_RATES_MA.citroenFinance }),
      },
      {
        label: "Paiement comptant",
        sub: "Aucun intérêt",
        q: quote({ ...base, annualRatePct: 0, termMonths: 1 }),
      },
    ];
  }, [model, downPayment, tradeIn, term]);

  const tco = useMemo(
    () =>
      computeTco({
        vehiclePrice: model.priceFrom,
        fuelType: model.fuelType,
        annualKm,
        yearsOfOwnership: 5,
      }),
    [model, annualKm]
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-6 rounded-2xl border border-[--brand-border] bg-white p-6">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[--brand-ink-muted]">
            Modèle
          </label>
          <select
            value={modelSlug}
            onChange={(e) => setModelSlug(e.target.value)}
            className="h-11 w-full rounded-lg border border-[--brand-border] bg-white px-3 text-sm"
          >
            {catalog.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name} — {formatMAD(m.priceFrom)} MAD
              </option>
            ))}
          </select>
        </div>

        <SliderField
          label="Apport initial"
          suffix="MAD"
          value={downPayment}
          min={0}
          max={Math.min(model.priceFrom, 500_000)}
          step={5_000}
          onChange={setDownPayment}
        />

        <SliderField
          label="Reprise de véhicule"
          suffix="MAD"
          value={tradeIn}
          min={0}
          max={300_000}
          step={5_000}
          onChange={setTradeIn}
        />

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[--brand-ink-muted]">
            Durée de crédit
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                className={
                  t === term
                    ? "h-10 rounded-lg bg-[--brand-ink] text-sm font-medium text-white"
                    : "h-10 rounded-lg border border-[--brand-border] bg-white text-sm text-[--brand-ink] hover:border-[--brand-ink]"
                }
              >
                {t} m
              </button>
            ))}
          </div>
        </div>

        <SliderField
          label="Kilométrage annuel"
          suffix="km"
          value={annualKm}
          min={5_000}
          max={40_000}
          step={1_000}
          onChange={setAnnualKm}
        />
      </aside>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Vos options de financement</h2>
          <p className="mt-1 text-sm text-[--brand-ink-muted]">
            Mensualités calculées pour {model.name} sur {term} mois, après apport et reprise.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {quotes.map((qt, i) => (
              <div
                key={qt.label}
                className={
                  i === 1
                    ? "rounded-2xl border-2 border-[--brand-primary] bg-white p-5 shadow-sm"
                    : "rounded-2xl border border-[--brand-border] bg-white p-5"
                }
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{qt.label}</div>
                  {i === 1 && (
                    <span className="rounded-full bg-[--brand-primary] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                      Recommandé
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-[--brand-ink-muted]">{qt.sub}</div>
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-[--brand-ink-muted]">
                    Mensualité
                  </div>
                  <div className="mt-1 text-3xl font-semibold">
                    {qt.q.monthlyPayment === 0
                      ? "—"
                      : `${formatMAD(qt.q.monthlyPayment)}`}
                    {qt.q.monthlyPayment > 0 && (
                      <span className="ms-1 text-sm font-normal text-[--brand-ink-muted]">
                        MAD/mois
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-[--brand-ink-muted]">
                    <div>
                      Montant financé : {formatMAD(qt.q.principal)} MAD
                    </div>
                    <div>Taux : {qt.q.annualRatePct}%</div>
                    <div>
                      Total payé :{" "}
                      {qt.q.monthlyPayment === 0
                        ? formatMAD(qt.q.principal)
                        : formatMAD(qt.q.totalPaid)}{" "}
                      MAD
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[--brand-border] bg-[--brand-surface-alt] p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Coût total de possession (5 ans)
              </h3>
              <p className="text-sm text-[--brand-ink-muted]">
                Basé sur {formatMAD(annualKm)} km/an et un profil d'usage mixte ville + autoroute.
              </p>
            </div>
            <div className="text-end">
              <div className="text-xs uppercase tracking-widest text-[--brand-ink-muted]">
                Total estimé
              </div>
              <div className="text-2xl font-semibold">
                {formatMAD(tco.totalMAD)} MAD
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Dépréciation", value: tco.depreciationMAD },
              { label: "Carburant / énergie", value: tco.fuelMAD },
              { label: "Assurance", value: tco.insuranceMAD },
              { label: "Entretien", value: tco.servicingMAD },
            ].map((row) => (
              <div key={row.label} className="rounded-xl bg-white p-4">
                <div className="text-[11px] uppercase tracking-widest text-[--brand-ink-muted]">
                  {row.label}
                </div>
                <div className="mt-1 text-base font-semibold">
                  {formatMAD(row.value)} MAD
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[--brand-ink-muted]">
            Estimations indicatives — vos chiffres exacts dépendent de votre profil, de votre dealer et de votre usage.
            Rihla peut vous aider à affiner.
          </p>
        </section>
      </div>
    </div>
  );
}

function SliderField({
  label,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-widest text-[--brand-ink-muted]">
          {label}
        </label>
        <span className="text-sm font-semibold">
          {formatMAD(value)} {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[--brand-border] accent-[--brand-primary]"
      />
    </div>
  );
}
