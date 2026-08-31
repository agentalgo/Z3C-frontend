import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';

import { auth } from '../../atoms';
import { decodeString } from '../../utils';
import ZatcaEnvironmentRequest from '../../requests/zatca-environment.request';

/**
 * Header pill stating which ZATCA environment this deployment is operating in.
 *
 * The value is read from the backend, never inferred in the browser: the frontend
 * has no reliable way to know which gateway the server will call. The API reports
 * both the effective environment (ZATCA_ENV, which selects the gateway URL) and the
 * environment the EGS certificate was issued for, so the two can be compared.
 *
 * Four states, because "which environment" and "is it usable" are separate
 * questions:
 *
 *   NOT_ONBOARDED         no certificate — nothing can be signed yet
 *   ACTIVE                onboarded, and the certificate matches ZATCA_ENV
 *   ENVIRONMENT_MISMATCH   onboarded for a DIFFERENT environment than ZATCA_ENV.
 *                          The backend refuses to sign in this state, so it is
 *                          shown as an error rather than as an environment name.
 *   (render nothing)       the request failed — better silent than wrong, since a
 *                          badge naming the wrong environment is worse than none
 */

const PRESENTATION = {
  production: {
    label: 'Production',
    // Green as in "live" — this is the only environment where invoices are
    // legally reported.
    className:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
    icon: 'verified',
  },
  simulation: {
    label: 'Simulation',
    className:
      'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
    icon: 'science',
  },
  sandbox: {
    label: 'Sandbox',
    className:
      'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
    icon: 'construction',
  },
};

const NOT_ONBOARDED = {
  label: 'Not onboarded',
  className:
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
  icon: 'link_off',
};

const MISMATCH = {
  label: 'Env mismatch',
  className:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30',
  icon: 'error',
};

const titleCase = (value) =>
  typeof value === 'string' && value.length
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;

function EnvironmentBadge() {
  const authValue = useAtomValue(auth);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!authValue) return;
    const token = decodeString(authValue);
    if (!token) return;

    // `cancelled` is not lint hygiene: the badge refetches on token change and on
    // window focus, so without it a slow earlier response can land after a newer
    // one and show a stale environment.
    let cancelled = false;

    const load = () => {
      ZatcaEnvironmentRequest(token)
        .then((data) => {
          if (!cancelled) setInfo(data);
        })
        .catch(() => {
          // Silent by design — see the component comment.
          if (!cancelled) setInfo(null);
        });
    };

    load();

    // Onboarding usually happens outside this tab (a script, curl, or another
    // browser). The header never unmounts while navigating, so without this the
    // badge would keep saying "Not onboarded" until a full page reload.
    window.addEventListener('focus', load);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', load);
    };
  }, [authValue]);

  // Signed out renders nothing, so the effect never has to clear state itself.
  if (!authValue || !info) return null;

  const { status, environment, onboardedEnvironment, gatewayUrl } = info;

  let presentation;
  if (status === 'NOT_ONBOARDED') {
    presentation = NOT_ONBOARDED;
  } else if (status === 'ENVIRONMENT_MISMATCH') {
    presentation = MISMATCH;
  } else {
    presentation =
      PRESENTATION[environment] ?? {
        // An unrecognised value is still worth showing verbatim rather than
        // hiding: it means ZATCA_ENV is set to something the app does not expect.
        label: titleCase(environment) || 'Unknown',
        className: NOT_ONBOARDED.className,
        icon: 'help',
      };
  }

  // Hover detail, so the badge can be verified rather than trusted.
  const tooltip =
    status === 'NOT_ONBOARDED'
      ? `No EGS certificate stored — complete ZATCA onboarding before invoicing.\nConfigured environment: ${environment}`
      : status === 'ENVIRONMENT_MISMATCH'
        ? `The EGS was onboarded for "${onboardedEnvironment}" but the app is configured for "${environment}".\nInvoices cannot be signed until these agree — re-onboard, or correct ZATCA_ENV and restart.`
        : `ZATCA environment: ${environment}\nCertificate issued for: ${onboardedEnvironment ?? 'unknown'}\nGateway: ${gatewayUrl ?? 'unknown'}`;

  return (
    <span
      title={tooltip}
      aria-label={`ZATCA environment: ${presentation.label}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset cursor-default select-none ${presentation.className}`}
    >
      <span className="material-symbols-outlined text-[14px] leading-none">
        {presentation.icon}
      </span>
      {presentation.label}
    </span>
  );
}

export default EnvironmentBadge;
