# RFxchange Preview Deployment

RFxchange uses the existing Firebase App Hosting backend `rfxchange` in `us-east4` for the canonical hosted preview of merged `main`.

Preview origin:

`https://rfxchange--rfxchange.us-east4.hosted.app/`

The backend remains connected to `AccelAnalysis/RFxchange` with live branch `main`. This file intentionally contains no secrets and does not create an alternate runtime, persistence model, authentication system, or map implementation.

A merge to `main` is the deployment trigger for the connected App Hosting backend. The hosted preview must continue to use Firebase Authentication, Firestore, Firebase Functions, Firebase Storage, and Mapbox through RFxchange's existing production contracts.
