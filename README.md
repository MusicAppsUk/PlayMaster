# PlayMaster v0.1.2 — rhythm-grid prototype

PlayMaster is a Music Apps UK prototype for turning lawful local audio into musician-facing information.

## What v0.1.2 does

- Loads a local audio file in the browser.
- Uses Essentia.js / WebAssembly for real analysis.
- Detects global key and confidence.
- Detects tempo (BPM), beat positions and beat confidence with `RhythmExtractor2013`.
- Builds a measured HPCP/chroma sequence and estimates major/minor chord regions.
- Shows detected harmonic regions on the lead-sheet timeline.
- Associates chord boundaries with their nearest detected beats.
- Uses the audio element as the authoritative playback clock.

## Controlled test target

`PlayMaster_Test_G-D-Em-C.wav` is a synthetic 44.1 kHz test recording created for this project. It is 100 BPM in G major and contains G → D → Em → C repeated twice. It gives the analyser known ground truth without copyright/licensing issues.

Expected v0.1.2 result: key near G major, tempo near 100 BPM, a regular beat sequence, and eight G/D/Em/C harmonic regions.

## Important limitation

This is still an experimental analyser. A beat tracker identifies beat locations, but it does **not yet prove the time signature or downbeat (bar 1)**. The UI therefore reports beat numbers rather than pretending that every fourth detected beat is definitely a bar line. Downbeat/time-signature inference is a later step.

Real commercial recordings will be substantially harder than the synthetic test because of drums, vocals, bass movement, chord extensions, inversions, syncopation, tempo drift and production effects.

## Next engineering steps

1. Validate BPM/beat ticks against the 100 BPM synthetic file.
2. Add downbeat/time-signature inference and bar numbering.
3. Snap harmonic boundaries to a musically sensible beat grid.
4. Move expensive analysis off the main UI thread.
5. Add waveform/bar-grid visualization and bar-aware looping.
6. Test on lawful real-world recordings.

© 2026 Music Apps UK. All rights reserved.
