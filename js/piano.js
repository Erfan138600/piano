// کلاس اصلی پیانو
class Piano {
    constructor() {
        this.keys = new Map();
        this.keyBindings = new Map();
        this.activeKeys = new Set();
        this.noteDisplay = document.getElementById('noteDisplay');
        
        this.initializeKeyBindings();
        this.initializeKeys();
        this.addEventListeners();
        
        console.log('Piano initialized');
    }

    // تنظیم کلیدهای کیبورد
    initializeKeyBindings() {
        // کلیدهای سفید
        this.keyBindings.set('a', 'C4');
        this.keyBindings.set('s', 'D4');
        this.keyBindings.set('d', 'E4');
        this.keyBindings.set('f', 'F4');
        this.keyBindings.set('g', 'G4');
        this.keyBindings.set('h', 'A4');
        this.keyBindings.set('j', 'B4');
        this.keyBindings.set('k', 'C5');
        this.keyBindings.set('l', 'D5');
        this.keyBindings.set(';', 'E5');

        // کلیدهای سیاه
        this.keyBindings.set('w', 'C#4');
        this.keyBindings.set('e', 'D#4');
        this.keyBindings.set('t', 'F#4');
        this.keyBindings.set('y', 'G#4');
        this.keyBindings.set('u', 'A#4');
        this.keyBindings.set('o', 'C#5');
        this.keyBindings.set('p', 'D#5');
    }

    // راه‌اندازی کلیدهای پیانو
    initializeKeys() {
        const keyElements = document.querySelectorAll('.key[data-note]');
        
        keyElements.forEach(keyElement => {
            const note = keyElement.getAttribute('data-note');
            const keyboardKey = keyElement.getAttribute('data-key');
            
            if (note) {
                this.keys.set(note, keyElement);
                
                // اضافه کردن event listener برای کلیک و لمس
                this.addKeyEventListeners(keyElement, note);
            }
        });
    }

    // اضافه کردن event listener برای هر کلید
    addKeyEventListeners(keyElement, note) {
        // Mouse events
        keyElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.playNote(note);
        });

        keyElement.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopNote(note);
        });

        keyElement.addEventListener('mouseleave', (e) => {
            this.stopNote(note);
        });

        // Touch events برای موبایل
        keyElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.playNote(note);
        });

        keyElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopNote(note);
        });

        keyElement.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopNote(note);
        });

        // جلوگیری از انتخاب متن
        keyElement.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
    }

    // اضافه کردن event listener های عمومی
    addEventListeners() {
        // کیبورد
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // جلوگیری از context menu در موبایل
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('key')) {
                e.preventDefault();
            }
        });

        // جلوگیری از zoom در موبایل
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // مدیریت فشردن کلید کیبورد
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        const note = this.keyBindings.get(key);
        
        if (note && !this.activeKeys.has(key)) {
            e.preventDefault();
            this.activeKeys.add(key);
            this.playNote(note);
        }
    }

    // مدیریت رها کردن کلید کیبورد
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        const note = this.keyBindings.get(key);
        
        if (note && this.activeKeys.has(key)) {
            e.preventDefault();
            this.activeKeys.delete(key);
            this.stopNote(note);
        }
    }

    // پخش نت
    playNote(note) {
        // بروزرسانی نمایش نت
        this.updateNoteDisplay(note);
        
        // اضافه کردن کلاس active به کلید
        const keyElement = this.keys.get(note);
        if (keyElement) {
            keyElement.classList.add('active');
            keyElement.classList.add('hit');
            
            // حذف کلاس hit بعد از انیمیشن
            setTimeout(() => {
                keyElement.classList.remove('hit');
            }, 200);
        }
        
        // پخش صدا
        if (window.audioEngine) {
            window.audioEngine.playNote(note, 0.8);
        }

        // اطلاع به سایر بخش‌ها
        this.dispatchNoteEvent('noteplayed', note);
    }

    // توقف نت
    stopNote(note) {
        const keyElement = this.keys.get(note);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        
        if (window.audioEngine) {
            window.audioEngine.stopNote(note);
        }

        this.dispatchNoteEvent('notestopped', note);
    }

    // بروزرسانی نمایش نت
    updateNoteDisplay(note) {
        if (this.noteDisplay && window.audioEngine) {
            const persianName = window.audioEngine.getPersianNoteName(note);
            this.noteDisplay.textContent = `نت فعلی: ${persianName} (${note})`;
        }
    }

    // ارسال رویداد نت
    dispatchNoteEvent(eventType, note) {
        const event = new CustomEvent(eventType, {
            detail: { note: note }
        });
        document.dispatchEvent(event);
    }

    // پخش مجموعه‌ای از نت‌ها با تأخیر
    async playSequence(notes, tempo = 1.0) {
        const baseDelay = 500 / tempo; // میلی‌ثانیه
        
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note && note !== 'rest') {
                this.playNote(note);
                
                // توقف نت بعد از مدت زمان مشخص
                setTimeout(() => {
                    this.stopNote(note);
                }, baseDelay * 0.8);
            }
            
            // تأخیر قبل از نت بعدی
            await new Promise(resolve => setTimeout(resolve, baseDelay));
        }
    }

    // تنظیم حجم
    setVolume(volume) {
        if (window.audioEngine) {
            window.audioEngine.setVolume(volume);
        }
    }

    // توقف همه نت‌ها
    stopAllNotes() {
        this.activeKeys.clear();
        
        // حذف کلاس active از همه کلیدها
        this.keys.forEach(keyElement => {
            keyElement.classList.remove('active');
        });
        
        if (window.audioEngine) {
            window.audioEngine.stopAllNotes();
        }
    }

    // گرفتن لیست نت‌های موجود
    getAvailableNotes() {
        return Array.from(this.keys.keys());
    }

    // بررسی وضعیت نت
    isNotePlaying(note) {
        const keyElement = this.keys.get(note);
        return keyElement ? keyElement.classList.contains('active') : false;
    }

    // تست عملکرد پیانو
    test() {
        console.log('Testing piano...');
        const testNotes = ['C4', 'E4', 'G4', 'C5'];
        this.playSequence(testNotes, 2.0);
    }

    // پاکسازی منابع
    destroy() {
        this.stopAllNotes();
        this.keys.clear();
        this.keyBindings.clear();
        this.activeKeys.clear();
    }
}

// راه‌اندازی پیانو پس از لود شدن DOM
document.addEventListener('DOMContentLoaded', () => {
    window.piano = new Piano();
    
    // تست اولیه (اختیاری)
    // setTimeout(() => window.piano.test(), 1000);
});

// پاکسازی هنگام بستن صفحه
window.addEventListener('beforeunload', () => {
    if (window.piano) {
        window.piano.destroy();
    }
    if (window.audioEngine) {
        window.audioEngine.destroy();
    }
});