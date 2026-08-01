# RFxchange Sonic Experience System

**Status: PLANNING AUTHORITY — NO PLACEHOLDER OR PRODUCTION AUDIO MAY SHIP WITHOUT APPROVED ASSETS, CONTROLS, AND ACCEPTANCE**

## 1. Purpose

Sound may make a meaningful RFxchange milestone memorable, but enterprise sound must be sparse, optional, restrained, and subordinate to visible state.

The sonic identity should feel:

- warm;
- precise;
- modern;
- reassuring;
- refined rather than playful;
- more like a quiet instrument than a mobile game.

Sound never grants authority, completes a domain event, replaces an accessible status, or implies a business outcome that has not occurred.

## 2. Signature concept

A custom three-part motif may express:

`Visible → Connected → Actionable`

Potential timbral direction:

- warm mallet or struck tonal element;
- soft synthetic layer;
- restrained low resonance;
- short decay;
- no dramatic cinematic rise;
- no cash-register, applause, fanfare, arcade, or generic notification-beep character.

The final motif must be professionally produced or explicitly approved. Do not synthesize and ship a temporary sound merely to satisfy the event contract.

## 3. Event families

| Event | Intended behavior | Domain boundary |
| --- | --- | --- |
| Organization marker activated | Short ascending arrival motif | Fires only after authoritative marker activation succeeds |
| Referral or teammate invitation accepted | Brief two-part connection tone | Acceptance is a connection state, not an economic outcome |
| RFx published or response submitted | Low, resolved confirmation | Fires only after authoritative publish/submission receipt |
| Verified outcome recorded | Warm completion chord | Requires an appropriate confirmed/verified outcome state |
| Credibility badge earned | Restrained seal-like tone | Requires an Active badge transition, not mere eligibility/progress |
| High-priority deadline/action | One neutral pulse | Must not imitate an emergency alarm or repeat excessively |

## 4. Events that remain silent

Do not play sound for:

- page loads;
- opening ordinary menus or drawers;
- hover or focus;
- typing;
- search and routine filtering;
- ordinary navigation;
- every incoming notification;
- profile views;
- map pan/zoom;
- saving minor preferences;
- routine profile completion;
- marketing-page media autoplay;
- synthetic activity intended to make the network appear busy.

## 5. User controls

When sonic runtime is implemented, provide:

- master sound control;
- notification sound control;
- milestone sound control;
- visible current state;
- persistence per authenticated participant where appropriate;
- immediate test/preview only through an explicit participant action;
- silent visual and accessible equivalents;
- quiet-hours integration where notification delivery supports it.

Default behavior must respect browser, device, operating-system, reduced-motion/sensory, and autoplay policies.

Sound must not autoplay on the public marketing page.

## 6. Default behavior

Until research and acceptance approve another default:

- milestone sound should be conservative and may default off for existing participants;
- notification sound should not be enabled merely because in-platform notifications exist;
- no sound should play before a participant has interacted with the application where browser policy requires interaction;
- sound preference must not be inferred from membership tier, organization type, or accessibility status;
- changing sound preferences must not alter event state.

## 7. Volume, duration, and frequency

### 7.1 Duration

Directional limits:

- neutral pulse: approximately 150–350ms;
- connection tone: approximately 300–700ms;
- marker arrival: approximately 500–1,000ms;
- outcome/credibility completion: approximately 600–1,200ms.

Avoid sounds long enough to delay work or overlap routine speech.

### 7.2 Loudness

- normalize assets to a restrained relative loudness;
- avoid sudden peaks;
- avoid heavy bass that is disruptive on shared-office systems;
- do not override device volume;
- preview uses the participant’s current sound setting and a restrained level.

### 7.3 Rate limiting

- aggregate repeated notifications rather than sounding each event;
- suppress duplicates;
- do not replay a milestone on every page visit;
- one underlying domain event produces at most one sonic event per participant context;
- background-tab events should normally defer or remain silent;
- quiet hours suppress eligible notification sounds without hiding the notification.

## 8. Event contract

Sound must subscribe to an authoritative application/domain event, not a button click that may fail.

Required event metadata should include, as applicable:

- event type;
- event identifier/idempotency key;
- participant/user;
- organization context;
- occurred/confirmed timestamp;
- verification/provenance level;
- whether the event is synthetic tutorial state;
- whether it has already been presented to this participant;
- sensory-preference resolution.

A failed mutation must not produce a success sound.

Synthetic orientation may use a distinct, quieter teaching variation only if it is clearly contained and does not resemble evidence of live market activity.

## 9. Accessibility

Every sound event requires a visible and screen-reader-accessible equivalent.

Examples:

- marker arrival sound accompanies visible marker activation and success text;
- connection tone accompanies status update and path resolution;
- deadline pulse accompanies a labeled deadline warning;
- outcome chord accompanies provenance-aware outcome text;
- credibility tone accompanies the badge label and explanation.

Requirements:

- no information conveyed only through pitch or sound;
- no critical alert relies only on audio;
- sound can be disabled without losing functionality;
- captions/transcripts are not required for abstract tones, but the associated event label must be available;
- avoid frequencies or patterns likely to be painful or alarming;
- respect assistive-technology announcement timing so sound does not mask speech.

## 10. Haptics

Light haptic feedback may be considered on supported mobile devices for intentional completion actions such as:

- successful submission;
- accepted invitation;
- marker activation;
- verified outcome confirmation.

Haptics require:

- explicit platform support;
- a sensory preference;
- no use for hover or routine navigation;
- no repeated vibration for ordinary notifications;
- a silent/no-haptic equivalent;
- accessibility and battery review.

Haptics are a net-new product capability and must not be hidden inside a visual-brand implementation.

## 11. Asset governance

Each production audio asset must have:

- stable semantic name;
- version;
- owner/creator and usage rights;
- source file and optimized delivery format;
- duration and loudness metadata;
- event-family assignment;
- replacement/deprecation policy;
- accessibility review;
- browser/device compatibility evidence.

Do not commit unlicensed audio, ripped commercial sound, generic marketplace samples without rights documentation, or font/audio bundles unrelated to the product.

## 12. Performance and delivery

- audio assets should be small and lazily loaded;
- ordinary application use should not block on audio;
- preloading is limited to likely enabled milestones after participant interaction;
- playback failures fail silently while visible state remains complete;
- audio code must not delay route transitions or domain confirmation;
- do not initialize an unnecessary heavyweight audio engine for a small event set;
- background playback is prohibited.

## 13. Privacy and environment

- do not use microphone access for the sonic identity;
- do not infer physical environment from ambient audio;
- do not record playback behavior for advertising;
- preference analytics, if later approved, should be aggregate and purpose-limited;
- never expose another participant’s private event through shared-device audio before authorization and notification rules permit it.

## 14. Acceptance

A sonic event is acceptable only when:

- authoritative success occurs before playback;
- visible and accessible equivalents are complete;
- master/category controls work;
- quiet hours and duplicate suppression work where applicable;
- sound remains restrained at representative device volumes;
- replay/idempotency rules prevent repeated milestone playback;
- public pages never autoplay audio;
- disabled sound produces no functional loss;
- background and failed playback do not disrupt the application;
- assets have documented rights and provenance;
- synthetic tutorial audio cannot be mistaken for live market evidence.
