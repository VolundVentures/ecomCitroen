"use client";

// Client-side action dispatcher for Rihla tool-use events.
// The API route emits ND-JSON lines with {type:"tool", name, input}; this module
// turns them into real DOM / router side effects.

export type ConfiguratorChange = {
  modelSlug?: string;
  colorId?: string;
  trimId?: string;
  angleIndex?: number;
};

const CONFIG_EVENT = "rihla:configurator";
const SECTION_EVENT = "rihla:scroll";
const FINANCING_EVENT = "rihla:financing";
const END_CALL_EVENT = "rihla:end-call";
const TEST_DRIVE_EVENT = "rihla:test-drive";

export type TestDrivePayload = {
  slug?: string;
  firstName?: string;
  phone?: string;
  city?: string;
  preferredSlot?: string;
};

export function emitEndCall() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(END_CALL_EVENT));
}

export function onEndCall(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const listener = () => cb();
  window.addEventListener(END_CALL_EVENT, listener);
  return () => window.removeEventListener(END_CALL_EVENT, listener);
}

export function emitTestDrive(payload: TestDrivePayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TestDrivePayload>(TEST_DRIVE_EVENT, { detail: payload }));
}

export function onTestDrive(cb: (p: TestDrivePayload) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => cb((e as CustomEvent<TestDrivePayload>).detail);
  window.addEventListener(TEST_DRIVE_EVENT, listener);
  return () => window.removeEventListener(TEST_DRIVE_EVENT, listener);
}

export type FinancingUpdate = {
  modelSlug?: string;
  downPayment?: number;
  termMonths?: number;
  tradeIn?: number;
};

export function emitFinancingUpdate(update: FinancingUpdate) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<FinancingUpdate>(FINANCING_EVENT, { detail: update }));
}

export function onFinancingUpdate(cb: (u: FinancingUpdate) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => cb((e as CustomEvent<FinancingUpdate>).detail);
  window.addEventListener(FINANCING_EVENT, listener);
  return () => window.removeEventListener(FINANCING_EVENT, listener);
}

export function emitConfiguratorChange(change: ConfiguratorChange) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ConfiguratorChange>(CONFIG_EVENT, { detail: change }));
}

export function onConfiguratorChange(cb: (c: ConfiguratorChange) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => cb((e as CustomEvent<ConfiguratorChange>).detail);
  window.addEventListener(CONFIG_EVENT, listener);
  return () => window.removeEventListener(CONFIG_EVENT, listener);
}

export function emitScrollTo(section: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(SECTION_EVENT, { detail: section }));
}

export function onScrollTo(cb: (section: string) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => cb((e as CustomEvent<string>).detail);
  window.addEventListener(SECTION_EVENT, listener);
  return () => window.removeEventListener(SECTION_EVENT, listener);
}

export type RihlaToolCall = {
  name: string;
  input: Record<string, unknown>;
};

type DispatchCtx = {
  locale: string;
  router: { push: (href: string) => void };
  currentPath?: string;
};

/** Resolve a tool_use call to an outcome description the model sees next turn. */
export function dispatchRihlaTool(call: RihlaToolCall, ctx: DispatchCtx): string {
  const { name, input } = call;
  const { locale, router, currentPath = "" } = ctx;

  try {
    switch (name) {
      case "navigate_to": {
        const raw = String(input.path ?? "/");
        const path = raw.startsWith("/") ? raw : `/${raw}`;
        const localePrefixed = path.startsWith(`/${locale}`) ? path : `/${locale}${path}`;
        if (currentPath === localePrefixed) return "already on that page";
        router.push(localePrefixed);
        return `navigated to ${localePrefixed}`;
      }
      case "open_model": {
        const slug = String(input.slug ?? "c3-aircross");
        const target = `/${locale}/models/${slug}`;
        if (currentPath === target) return "already on that model page";
        router.push(target);
        return `opened model detail for ${slug}`;
      }
      case "configure_car": {
        const change: ConfiguratorChange = {
          modelSlug: typeof input.slug === "string" ? input.slug : undefined,
          colorId: typeof input.color === "string" ? input.color : undefined,
          trimId: typeof input.trim === "string" ? input.trim : undefined,
          angleIndex:
            typeof input.angle === "number"
              ? input.angle
              : typeof input.angleIndex === "number"
              ? input.angleIndex
              : undefined,
        };
        // Only navigate if we're NOT already on the target model page — otherwise
        // just update the live configurator to avoid a full reload.
        const targetPath = change.modelSlug
          ? `/${locale}/models/${change.modelSlug}`
          : null;
        if (targetPath && currentPath !== targetPath) {
          router.push(targetPath);
        }
        emitConfiguratorChange(change);
        return `updated configurator with ${JSON.stringify(change)}`;
      }
      case "scroll_to": {
        const section = String(input.section ?? "");
        emitScrollTo(section);
        return `scrolled to ${section}`;
      }
      case "start_reservation": {
        const slug = String(input.slug ?? "c3-aircross");
        const target = `/${locale}/reserve/${slug}`;
        if (currentPath === target) return "already on reservation";
        router.push(target);
        return `started reservation for ${slug}`;
      }
      case "open_dealers": {
        const target = `/${locale}/dealers`;
        if (currentPath === target) return "already on dealers";
        router.push(target);
        return "opened dealers page";
      }
      case "open_financing": {
        const target = `/${locale}/financing`;
        if (currentPath !== target) router.push(target);
        return "opened financing advisor";
      }
      case "end_call": {
        emitEndCall();
        return "call ended";
      }
      case "book_test_drive": {
        const payload: TestDrivePayload = {
          slug: typeof input.slug === "string" ? input.slug : undefined,
          firstName: typeof input.firstName === "string" ? input.firstName : undefined,
          phone: typeof input.phone === "string" ? input.phone : undefined,
          city: typeof input.city === "string" ? input.city : undefined,
          preferredSlot: typeof input.preferredSlot === "string" ? input.preferredSlot : undefined,
        };
        emitTestDrive(payload);
        return `test drive booked for ${payload.firstName ?? "lead"} (${payload.phone ?? "no phone"}) on ${payload.slug ?? "model"}`;
      }
      case "calculate_financing": {
        const update: FinancingUpdate = {};
        if (typeof input.slug === "string") update.modelSlug = input.slug;
        if (typeof input.vehiclePrice === "number") {
          // Map price to model slug
          const priceMap: Record<number, string> = { 234900: "c3-aircross", 295900: "c5-aircross", 195900: "berlingo" };
          update.modelSlug = priceMap[input.vehiclePrice] ?? update.modelSlug;
        }
        if (typeof input.downPayment === "number") update.downPayment = input.downPayment;
        if (typeof input.termMonths === "number") update.termMonths = input.termMonths;
        if (typeof input.tradeIn === "number") update.tradeIn = input.tradeIn;

        // Navigate to financing page if not already there
        const finTarget = `/${locale}/financing`;
        if (currentPath !== finTarget) router.push(finTarget);

        // Emit the update so the form picks it up
        setTimeout(() => emitFinancingUpdate(update), 500);

        // Run the calculation locally and return the result to the model
        const price = input.vehiclePrice as number || 234900;
        const dp = (input.downPayment as number) || 0;
        const months = (input.termMonths as number) || 60;
        const rate = (input.annualRatePct as number) || 5.99;
        const principal = price - dp;
        const mr = rate / 100 / 12;
        const monthly = mr === 0 ? principal / months : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
        return `Financing: ${Math.round(monthly)} MAD/month over ${months} months, principal ${principal} MAD, rate ${rate}%`;
      }
      default:
        return `unknown tool: ${name}`;
    }
  } catch (err) {
    return `tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
