
export function playAcknowledgementSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    let ctx
    try {
        ctx = playAcknowledgementSound.ctx || new AudioContext()
        playAcknowledgementSound.ctx = ctx
    } catch (e) {
        return
    }

    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
        return
    }

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.13)
}
