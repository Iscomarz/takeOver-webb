# The Sounds of Take Over Specification

## Purpose

Define a persistent, accessible and branded audio player for an approved Take Over SoundCloud set or playlist.

## Requirements

### Requirement: Dynamic Published Collection

The public website MUST load active sets from `tSoundsTakeOver` ordered by `orden`, while authenticated administrators MUST be able to create, edit, hide, reorder and delete records.

#### Scenario: Administrator publishes a set

- GIVEN an authenticated administrator saves a valid SoundCloud URL as active
- WHEN the public website is loaded again
- THEN the set MUST appear in the player collection according to its configured order.

#### Scenario: Administrator hides a set

- GIVEN an existing set is changed to inactive
- WHEN an anonymous visitor loads the public website
- THEN that set MUST NOT be returned or displayed.

### Requirement: Explicit Playback

The system MUST start paused and MUST require user action before playing or initializing audible media.

#### Scenario: First visit

- GIVEN a visitor opens any page
- WHEN it finishes loading
- THEN no audio MUST play automatically
- AND a Play control MUST be available.

#### Scenario: Visitor starts playback

- GIVEN the configured source is available
- WHEN Play is activated
- THEN the SoundCloud integration MUST initialize if necessary
- AND playback MUST begin
- AND the player MUST display a playing state.

### Requirement: Persistent Navigation Playback

The player MUST remain mounted in the root layout so normal SvelteKit client-side navigation does not interrupt audio.

#### Scenario: Navigation while playing

- GIVEN audio is playing
- WHEN the visitor navigates to another internal page
- THEN playback MUST continue without restarting
- AND progress and state MUST remain visible.

### Requirement: Playback Controls

The player MUST provide Play, Pause, seek, mute and volume controls when ready.

#### Scenario: Pause and resume

- GIVEN audio is playing
- WHEN the visitor pauses and later resumes
- THEN playback MUST resume from the paused position.

#### Scenario: Seek

- GIVEN duration is available
- WHEN the progress control changes
- THEN playback MUST move to the corresponding position.

### Requirement: Metadata and Feedback

The player MUST show available title and creator metadata and MUST represent loading, playing, paused and error states.

#### Scenario: Playing feedback

- GIVEN audio is playing
- WHEN the player is visible
- THEN its equalizer MUST animate
- AND MUST stop when paused.

#### Scenario: Missing metadata

- GIVEN SoundCloud omits artwork or text metadata
- WHEN the player renders
- THEN Take Over fallback artwork and labels MUST appear.

### Requirement: Responsive and Accessible UI

The player MUST be keyboard operable, expose accessible labels, respect reduced motion and avoid obscuring primary actions.

#### Scenario: Mobile viewport

- GIVEN a mobile-sized viewport
- WHEN the player renders
- THEN it MUST use its compact layout
- AND respect bottom safe-area spacing.

#### Scenario: Keyboard navigation

- GIVEN a keyboard user
- WHEN focus enters the player
- THEN every control MUST be reachable
- AND show visible focus.

### Requirement: Graceful Third-Party Failure

A SoundCloud error MUST NOT prevent the website from loading or being navigated.

#### Scenario: SoundCloud unavailable

- GIVEN the script or source fails
- WHEN the failure is detected
- THEN a non-blocking unavailable state MUST appear
- AND Retry and Open on SoundCloud SHOULD be offered
- AND the rest of the website MUST remain usable.
