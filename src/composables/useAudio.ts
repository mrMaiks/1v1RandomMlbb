import { ref } from 'vue'

const isMuted = ref(false)
let audioCtx: AudioContext | null = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function useAudio() {
  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  function playTick() {
    if (isMuted.value) return
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'square'
    osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime)
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.03)
  }

  function playStop() {
    if (isMuted.value) return
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }

  function playFanfare() {
    if (isMuted.value) return
    const ctx = getCtx()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.6)
    })
  }

  return { isMuted, toggleMute, playTick, playStop, playFanfare }
}