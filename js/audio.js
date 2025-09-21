// کلاس مدیریت صدا
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.oscillators = new Map();
        this.gainNode = null;
        this.isInitialized = false;
        this.noteFrequencies = {
            'C4': 261.63,
            'C#4': 277.18,
            'D4': 293.66,
            'D#4': 311.13,
            'E4': 329.63,
            'F4': 349.23,
            'F#4': 369.99,
            'G4': 392.00,
            'G#4': 415.30,
            'A4': 440.00,
            'A#4': 466.16,
            'B4': 493.88,
            'C5': 523.25,
            'C#5': 554.37,
            'D5': 587.33,
            'D#5': 622.25,
            'E5': 659.25
        };
        
        // نام‌های فارسی نت‌ها
        this.persianNotes = {
            'C4': 'دو',
            'C#4': 'دو دیز',
            'D4': 'ره',
            'D#4': 'ره دیز',
            'E4': 'می',
            'F4': 'فا',
            'F#4': 'فا دیز',
            'G4': 'سل',
            'G#4': 'سل دیز',
            'A4': 'لا',
            'A#4': 'لا دیز',
            'B4': 'سی',
            'C5': 'دو (اکتاو بالا)',
            'C#5': 'دو دیز (اکتاو بالا)',
            'D5': 'ره (اکتاو بالا)',
            'D#5': 'ره دیز (اکتاو بالا)',
            'E5': 'می (اکتاو بالا)'
        };
    }

    // راه‌اندازی AudioContext
    async initialize() {
        if (this.isInitialized) return;

        try {
            // تلاش برای ایجاد AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // ایجاد GainNode برای کنترل حجم
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = 0.3;
            
            this.isInitialized = true;
            console.log('AudioEngine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AudioEngine:', error);
            this.fallbackToSimpleAudio();
        }
    }

    // پشتیبانی از صدا در مرورگرهای قدیمی
    fallbackToSimpleAudio() {
        console.warn('Using fallback audio method');
        this.isInitialized = true;
    }

    // پخش نت
    playNote(note, duration = 0.5) {
        if (!this.isInitialized) {
            this.initialize().then(() => this.playNote(note, duration));
            return;
        }

        if (!this.audioContext) {
            this.playNoteFallback(note);
            return;
        }

        // توقف نت قبلی اگر در حال پخش باشد
        this.stopNote(note);

        const frequency = this.noteFrequencies[note];
        if (!frequency) {
            console.warn(`Unknown note: ${note}`);
            return;
        }

        try {
            // ایجاد Oscillator
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // تنظیم نوع موج برای صدای بهتر پیانو
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            // ایجاد envelope برای صدای طبیعی‌تر
            const currentTime = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.05); // Attack
            gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.2);  // Decay
            gainNode.gain.linearRampToValueAtTime(0.1, currentTime + duration - 0.1); // Sustain
            gainNode.gain.linearRampToValueAtTime(0, currentTime + duration); // Release

            // اتصال نودها
            oscillator.connect(gainNode);
            gainNode.connect(this.gainNode);

            // شروع پخش
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);

            // ذخیره oscillator برای کنترل
            this.oscillators.set(note, { oscillator, gainNode });

            // پاکسازی بعد از پایان
            oscillator.onended = () => {
                this.oscillators.delete(note);
            };

        } catch (error) {
            console.error(`Error playing note ${note}:`, error);
        }
    }

    // توقف نت
    stopNote(note) {
        if (this.oscillators.has(note)) {
            const { oscillator, gainNode } = this.oscillators.get(note);
            try {
                const currentTime = this.audioContext.currentTime;
                gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
                oscillator.stop(currentTime + 0.1);
            } catch (error) {
                console.warn(`Error stopping note ${note}:`, error);
            }
            this.oscillators.delete(note);
        }
    }

    // روش جایگزین برای مرورگرهای قدیمی
    playNoteFallback(note) {
        // ایجاد صدای ساده با فرکانس
        if (typeof AudioContext === 'undefined') {
            console.warn('Web Audio API not supported');
            return;
        }
        
        // استفاده از beep ساده
        this.beep(this.noteFrequencies[note] || 440, 200);
    }

    // ایجاد بیپ ساده
    beep(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }

    // تنظیم حجم صدا
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    // گرفتن نام فارسی نت
    getPersianNoteName(note) {
        return this.persianNotes[note] || note;
    }

    // توقف همه نت‌ها
    stopAllNotes() {
        for (const note of this.oscillators.keys()) {
            this.stopNote(note);
        }
    }

    // پاکسازی منابع
    destroy() {
        this.stopAllNotes();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.isInitialized = false;
    }
}

// تنها یک نمونه از AudioEngine
window.audioEngine = new AudioEngine();

// راه‌اندازی خودکار با اولین تعامل کاربر
document.addEventListener('click', () => {
    if (!window.audioEngine.isInitialized) {
        window.audioEngine.initialize();
    }
}, { once: true });

document.addEventListener('keydown', () => {
    if (!window.audioEngine.isInitialized) {
        window.audioEngine.initialize();
    }
}, { once: true });

document.addEventListener('touchstart', () => {
    if (!window.audioEngine.isInitialized) {
        window.audioEngine.initialize();
    }
}, { once: true });