# Proposal: The Sounds of Take Over

## Intent

Bring Take Over's musical identity into the website with a persistent, branded mini player for curated SoundCloud sets and playlists.

## Scope

### In Scope

- Create a floating `MiniPlayer.svelte` available across the website.
- Load an ordered collection of active SoundCloud sets from Supabase.
- Provide an authenticated admin CRUD screen for creating, editing, ordering, hiding and deleting sets.
- Provide play, pause, mute/volume, progress and expand/collapse controls.
- Show track or set title, creator and artwork when available.
- Animate an equalizer only while audio is playing.
- Keep playback alive during SvelteKit client-side navigation.
- Provide responsive desktop and mobile presentations.
- Handle loading and third-party failures without blocking the website.

### Out of Scope

- SoundCloud or Spotify user authentication.
- Catalog search, user queues or user playlists.
- Admin dashboard for audio curation.
- Self-hosting audio files.
- Autoplay.
- New analytics.

## New Capabilities

- `sounds-of-take-over`: Persistent playback of an authorized Take Over set or playlist from a branded global player.

## Approach

Mount a custom Svelte mini player in the root layout. It will initialize and control a SoundCloud widget after user interaction, synchronize widget events with a global Svelte store and expose accessible custom controls. Initial content will be configured separately from component logic.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/routes/+layout.svelte` | Modified | Mount the player once for persistent SPA playback. |
| `src/lib/components/MiniPlayer.svelte` | New | Player UI, widget lifecycle and controls. |
| `src/lib/stores/audioStore.js` | New | Playback, metadata and UI state. |
| `src/routes/+layout.server.js` | New | Query active ordered sets for the public player. |
| `take-over-admin/src/routes/sounds/+page.svelte` | New | Administrative CRUD screen. |
| `tSoundsTakeOver` | New | Shared Supabase configuration table. |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| SoundCloud unavailable | Medium | Non-blocking error state with retry and external link. |
| Autoplay rejected | Low | Require explicit Play interaction. |
| Player covers mobile UI | Medium | Compact mode and safe-area offsets. |
| Playback resets | Low | Mount only in the persistent root layout. |
| Unauthorized content | Low | Use only an approved source URL. |

## Rollback Plan

Remove `MiniPlayer` from the root layout and delete the new player, store and configuration modules. No database rollback is required.

## Dependencies

- At least one approved public SoundCloud set or playlist URL.
- SoundCloud Widget API from `w.soundcloud.com`.

## Success Criteria

- [ ] Visitors can explicitly start, pause and resume audio.
- [ ] Playback continues while navigating between internal pages.
- [ ] Progress, metadata and playing state stay synchronized.
- [ ] The player works on desktop and mobile without hiding primary actions.
- [ ] SoundCloud failures do not affect the rest of the website.
