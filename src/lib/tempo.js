/*
  Tempo from a 30 s preview clip, in the browser: decode → RMS onset envelope → autocorrelation 60–190 BPM.
  Used when the now-playing endpoint has no bpm for the track (Spotify closed audio-features to new apps).
  Returns { bpm, energy } or null. Energy is loudness-based, 0.15–0.95.
*/
export async function estimateTempo(url) {
  try {
    const buf = await (await fetch(url)).arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const ac = new AC(); const audio = await ac.decodeAudioData(buf); if (ac.close) ac.close();
    const sr = audio.sampleRate, ch = audio.numberOfChannels, n = audio.length; const mono = new Float32Array(n);
    for (let c = 0; c < ch; c++) { const d = audio.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / ch; }
    const hop = 512, frames = Math.floor(n / hop); const env = new Float32Array(frames); let rms = 0;
    for (let f = 0; f < frames; f++) { let e = 0; for (let i = f * hop; i < (f + 1) * hop; i++) e += mono[i] * mono[i]; env[f] = Math.sqrt(e / hop); rms += env[f]; }
    rms /= frames;
    const onset = new Float32Array(frames); for (let f = 1; f < frames; f++) onset[f] = Math.max(0, env[f] - env[f - 1]);
    const mean = onset.reduce((a, b) => a + b, 0) / frames; for (let f = 0; f < frames; f++) onset[f] -= mean;
    const fps = sr / hop; const minLag = Math.round(fps * 60 / 190), maxLag = Math.round(fps * 60 / 60); let best = 0, bestLag = minLag;
    for (let lag = minLag; lag <= maxLag; lag++) { let sum = 0; for (let f = lag; f < frames; f++) sum += onset[f] * onset[f - lag]; sum *= 1 + (lag - minLag) / (maxLag - minLag) * .15; if (sum > best) { best = sum; bestLag = lag; } }
    let bpm = 60 * fps / bestLag; while (bpm > 180) bpm /= 2; while (bpm < 70) bpm *= 2;
    return { bpm: Math.round(bpm), energy: Math.max(.15, Math.min(.95, (rms - .04) / .22)) };
  } catch { return null; }
}
