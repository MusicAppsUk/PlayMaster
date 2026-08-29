# PlayMaster v0.1.1 — chord-analysis repair

© 2026 Music Apps UK.

This build proves the first genuine PlayMaster analysis path in the browser.

## What works
- local lawful audio selection and playback
- Essentia.js WebAssembly tonal analysis
- automatic key/scale estimation with confidence
- automatic major/minor chord estimation from HPCP tonal features
- compression of frame-level chord estimates into a timed harmonic timeline
- live current/next chord driven by the detected timeline
- lead-sheet-style detected chord regions with timestamps and strength
- seeking, play/pause, ±5 seconds, auto-follow
- two hand-authored demonstration progressions remain available for UI testing

## Honest limitations
- This is an experimental tonal analyser, not yet production-grade transcription.
- Essentia's ChordsDetection family estimates major/minor triads; extensions, inversions and dense mixes can be misidentified.
- Tempo/beat-grid extraction is not yet wired into this build, so detected regions are time-based rather than snapped to bars.
- The Essentia library is loaded from jsDelivr, so first use needs Internet access. Before production/GitHub release we should pin/vendor dependencies and add licence notices.
- Analysis currently runs on the main browser thread. A Web Worker is the next performance hardening step for tablets and long tracks.

## Next engineering steps
1. Beat/BPM extraction and beat-synchronous chord detection.
2. Web Worker analysis so UI stays fluid.
3. Waveform and bar/beat grid.
4. Chord smoothing/confidence thresholds and correction UI.
5. Lawful Internet-hosted test track and/or local-file workflow.
6. Stem separation experiment after the tonal pipeline is validated.


## v0.1.1
Repairs the Android/browser chord path by explicitly computing frame spectra, spectral peaks and 12-bin HPCPs before chord estimation. The known G-major test remains a ground-truth test only; its chord sequence is not embedded in the analyser.
