# ESLint compatibility

RFxchange pins ESLint 9.39.5 while `eslint-config-next` 16.2.11 depends on an `eslint-plugin-react` version that is not yet compatible with ESLint 10's rule context API.

The previous ESLint 10.7.0 configuration crashed while loading `react/display-name` before linting application code. This pin is a temporary compatibility constraint, not a disabled lint rule.

Upgrade to ESLint 10 only after the Next.js lint dependency chain supports ESLint 10 without compatibility shims or runtime rule crashes.
