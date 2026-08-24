/**
 * Audio Effects using Web Audio API (No external sound files required)
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playCheck() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const now = this.ctx.currentTime;

            // Harmonious two-tone chime (E6 to B6)
            osc.frequency.setValueAtTime(1318.51, now); // E6
            osc.frequency.exponentialRampToValueAtTime(1975.53, now + 0.08); // B6

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    playUncheck() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            const now = this.ctx.currentTime;

            // Soft pop down
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(250, now + 0.06);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    playCelebration() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            // Play celebratory fanfare chord progression (C5 -> E5 -> G5 -> C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            const now = this.ctx.currentTime;

            notes.forEach((freq, index) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const startTime = now + (index * 0.09);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.18, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.4);
            });
        } catch (e) {
            console.warn('Celebration audio error:', e);
        }
    }
}

window.soundEffects = new SoundEffects();
