# Exploration: sounds-of-take-over

## Current State

1. The root layout at `src/routes/+layout.svelte` persists across SvelteKit navigation, making it the correct integration point for uninterrupted audio.
2. The project has Svelte stores under `src/lib/stores`, but no global audio store or reusable media player.
3. SoundCloud links already exist in crew profiles, but the website does not embed or control SoundCloud audio.
4. There is no audio SDK dependency in `package.json`.
5. The visual system already uses dark translucent surfaces and the green accent `#56FDB8`.

## Affected Areas

- `src/routes/+layout.svelte` — Mount the global mini player.
- `src/lib/components/MiniPlayer.svelte` — Floating player UI and SoundCloud Widget integration.
- `src/lib/stores/audioStore.js` — Global playback and UI state.
- `src/lib/config/audio.js` — Curated SoundCloud source configuration.

## Approaches

### 1. Native HTML Audio with self-hosted files

- Pros: Full playback and styling control.
- Cons: Requires audio hosting, bandwidth management and explicit distribution rights.
- Effort: Medium.

### 2. SoundCloud Widget API

- Pros: Supports public sets, avoids hosting large audio files and provides playback events for a custom UI.
- Cons: Depends on SoundCloud availability and an external widget script.
- Effort: Low to medium.

### 3. Spotify Web Playback SDK

- Pros: Strong catalog and Spotify ecosystem integration.
- Cons: Full playback requires authentication and generally a Premium account; token management expands backend and privacy scope.
- Effort: High.

## Recommendation

Use the SoundCloud Widget API for the first release. Control a hidden widget through a branded `MiniPlayer` mounted in the root layout so playback survives client-side navigation.

The initial source URL will live in `src/lib/config/audio.js`. The player MUST start paused and only initialize audible media after explicit user interaction.

## Risks

- **Third-party failure:** Show a non-blocking unavailable state.
- **Autoplay restrictions:** Never autoplay.
- **Navigation interruption:** Keep the player in the root layout.
- **Mobile obstruction:** Use a compact layout and safe-area spacing.
- **Copyright:** Configure only audio Take Over is authorized to publish.
- **Privacy:** Avoid contacting SoundCloud before interaction where practical.

## Ready for Proposal

Yes.
