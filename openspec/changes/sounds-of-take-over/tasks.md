# Tasks: The Sounds of Take Over

## Review Workload Forecast

| Field | Value |
| --- | --- |
| Estimated changed lines | 300-450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single feature PR |
| Delivery strategy | Disabled config flag until approval |

Decision needed before production: Yes — execute the SQL and add an approved public SoundCloud URL.

## Phase 1: Configuration and State

- [ ] 1.1 Execute `supabase/tSoundsTakeOver.sql` in Supabase.
- [x] 1.2 Create the dynamic public Supabase query.
- [x] 1.3 Create `src/lib/stores/audioStore.js`.
- [x] 1.4 Create the admin CRUD service and screen.

## Phase 2: Player Integration

- [x] 2.1 Create `src/lib/components/MiniPlayer.svelte`.
- [x] 2.2 Load the SoundCloud Widget API once after explicit interaction.
- [x] 2.3 Bind READY, PLAY, PAUSE, FINISH, ERROR and PLAY_PROGRESS.
- [x] 2.4 Implement play/pause, seek, mute and volume.
- [x] 2.5 Implement metadata and artwork fallbacks.

## Phase 3: UI and Global Mount

- [x] 3.1 Build collapsed and expanded glassmorphism presentations.
- [x] 3.2 Add playing equalizer and reduced-motion fallback.
- [x] 3.3 Add keyboard access and labels.
- [x] 3.4 Add mobile positioning and safe-area support.
- [x] 3.5 Mount `MiniPlayer` once in `src/routes/+layout.svelte`.

## Phase 4: Verification

- [ ] 4.1 Verify audio starts only after Play.
- [ ] 4.2 Verify playback continues through internal navigation.
- [ ] 4.3 Verify progress, seeking, volume and metadata.
- [ ] 4.4 Verify mobile/desktop layouts and overlay stacking.
- [ ] 4.5 Verify graceful SoundCloud failure.
- [x] 4.6 Run `npm run build` in both projects (passed with existing warnings).

## Phase 5: Release

- [ ] 5.1 Confirm publishing rights for the audio.
- [ ] 5.2 Enable the production feature flag.
- [ ] 5.3 Mark the idea completed after production verification.
