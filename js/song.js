// کلاس مدیریت آهنگ بلاچو
class BelachoSong {
    constructor() {
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        this.playInterval = null;
        this.tempo = 1.0;
        this.progressBar = document.getElementById('progress');
        
        // نت‌های آهنگ بلاچو (ساده‌شده برای پیانو)
        this.songNotes = [
            // بخش اول - ملودی اصلی
            { note: 'G4', duration: 0.5 },
            { note: 'A4', duration: 0.5 },
            { note: 'B4', duration: 0.5 },
            { note: 'C5', duration: 1.0 },
            { note: 'rest', duration: 0.25 },
            { note: 'D5', duration: 0.75 },
            { note: 'C5', duration: 0.5 },
            { note: 'B4', duration: 0.5 },
            { note: 'A4', duration: 1.0 },
            { note: 'rest', duration: 0.5 },
            
            // بخش دوم
            { note: 'G4', duration: 0.5 },
            { note: 'F4', duration: 0.5 },
            { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 1.0 },
            { note: 'rest', duration: 0.25 },
            { note: 'C4', duration: 0.75 },
            { note: 'D4', duration: 0.5 },
            { note: 'E4', duration: 0.5 },
            { note: 'F4', duration: 1.0 },
            { note: 'rest', duration: 0.5 },
            
            // تکرار بخش اول (کوتاه‌تر)
            { note: 'G4', duration: 0.5 },
            { note: 'A4', duration: 0.5 },
            { note: 'B4', duration: 0.75 },
            { note: 'C5', duration: 0.75 },
            { note: 'D5', duration: 1.0 },
            { note: 'rest', duration: 0.25 },
            { note: 'C5', duration: 0.5 },
            { note: 'B4', duration: 0.5 },
            { note: 'A4', duration: 0.5 },
            { note: 'G4', duration: 1.5 },
            
            // پایان
            { note: 'rest', duration: 0.5 },
            { note: 'F4', duration: 0.5 },
            { note: 'G4', duration: 1.0 },
            { note: 'rest', duration: 1.0 }
        ];

        // نت‌های ساده‌تر برای نمایش
        this.displayNotes = [
            'G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4',
            'G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4', 'F4',
            'G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4', 'G4'
        ];

        this.initializeControls();
        this.updateNoteDisplay();
    }

    // راه‌اندازی کنترل‌ها
    initializeControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const tempoSlider = document.getElementById('tempoSlider');
        const tempoValue = document.getElementById('tempoValue');

        if (playBtn) {
            playBtn.addEventListener('click', () => this.play());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (tempoSlider) {
            tempoSlider.addEventListener('input', (e) => {
                this.tempo = parseFloat(e.target.value);
                if (tempoValue) {
                    tempoValue.textContent = this.tempo.toFixed(1) + 'x';
                }
            });
        }
    }

    // شروع پخش آهنگ
    async play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.updateControls();

        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال پخش';
        }

        // اطمینان از راه‌اندازی AudioEngine
        if (window.audioEngine && !window.audioEngine.isInitialized) {
            await window.audioEngine.initialize();
        }

        this.playNextNote();
    }

    // پخش نت بعدی
    async playNextNote() {
        if (!this.isPlaying || this.currentNoteIndex >= this.songNotes.length) {
            this.complete();
            return;
        }

        const currentNoteData = this.songNotes[this.currentNoteIndex];
        const baseDuration = 400; // میلی‌ثانیه
        const noteDuration = (baseDuration * currentNoteData.duration) / this.tempo;

        // بروزرسانی progress bar
        this.updateProgress();

        // بروزرسانی نمایش نت در صفحه
        this.highlightCurrentNote();

        if (currentNoteData.note !== 'rest' && window.piano) {
            // پخش نت
            window.piano.playNote(currentNoteData.note);

            // توقف نت بعد از مدت زمان مشخص
            setTimeout(() => {
                if (window.piano) {
                    window.piano.stopNote(currentNoteData.note);
                }
            }, noteDuration * 0.8);
        }

        this.currentNoteIndex++;

        // تأخیر قبل از نت بعدی
        this.playInterval = setTimeout(() => {
            this.playNextNote();
        }, noteDuration);
    }

    // توقف پخش
    pause() {
        this.isPlaying = false;
        
        if (this.playInterval) {
            clearTimeout(this.playInterval);
            this.playInterval = null;
        }

        if (window.piano) {
            window.piano.stopAllNotes();
        }

        this.updateControls();
        this.clearNoteHighlight();
    }

    // شروع مجدد
    reset() {
        this.pause();
        this.currentNoteIndex = 0;
        this.updateProgress();
        this.clearNoteHighlight();
    }

    // تکمیل پخش
    complete() {
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        
        if (this.playInterval) {
            clearTimeout(this.playInterval);
            this.playInterval = null;
        }

        if (window.piano) {
            window.piano.stopAllNotes();
        }

        this.updateControls();
        this.updateProgress();
        this.clearNoteHighlight();

        // نمایش پیام تکمیل
        const noteDisplay = document.getElementById('noteDisplay');
        if (noteDisplay) {
            noteDisplay.textContent = 'پخش آهنگ تکمیل شد! 🎵';
            setTimeout(() => {
                noteDisplay.textContent = 'نت فعلی: -';
            }, 2000);
        }
    }

    // بروزرسانی کنترل‌ها
    updateControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (playBtn && pauseBtn) {
            if (this.isPlaying) {
                playBtn.disabled = true;
                pauseBtn.disabled = false;
                playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال پخش';
            } else {
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                playBtn.innerHTML = '<i class="fas fa-play"></i> پخش خودکار';
            }
        }
    }

    // بروزرسانی progress bar
    updateProgress() {
        if (this.progressBar) {
            const progress = (this.currentNoteIndex / this.songNotes.length) * 100;
            this.progressBar.style.width = `${Math.min(100, progress)}%`;
        }
    }

    // هایلایت نت فعلی در نمایش
    highlightCurrentNote() {
        // حذف هایلایت قبلی
        this.clearNoteHighlight();

        // یافتن نت فعلی در displayNotes
        if (this.currentNoteIndex < this.songNotes.length) {
            const currentNote = this.songNotes[this.currentNoteIndex].note;
            
            if (currentNote !== 'rest') {
                // هایلایت در نمایش نت‌ها
                const noteItems = document.querySelectorAll('.note-item');
                const displayIndex = this.currentNoteIndex % this.displayNotes.length;
                
                if (noteItems[displayIndex]) {
                    noteItems[displayIndex].classList.add('active');
                }

                // بروزرسانی نمایش نت فعلی
                const noteDisplay = document.getElementById('noteDisplay');
                if (noteDisplay && window.audioEngine) {
                    const persianName = window.audioEngine.getPersianNoteName(currentNote);
                    noteDisplay.textContent = `در حال پخش: ${persianName} (${currentNote})`;
                }
            }
        }
    }

    // حذف هایلایت نت‌ها
    clearNoteHighlight() {
        const noteItems = document.querySelectorAll('.note-item.active');
        noteItems.forEach(item => {
            item.classList.remove('active');
        });
    }

    // بروزرسانی نمایش نت‌ها در صفحه
    updateNoteDisplay() {
        const notesLines = document.querySelectorAll('.notes-line');
        
        if (notesLines.length >= 2) {
            // خط اول
            const firstLineNotes = this.displayNotes.slice(0, 8);
            notesLines[0].innerHTML = firstLineNotes.map(note => 
                `<span class="note-item">${note}</span>`
            ).join('');

            // خط دوم
            const secondLineNotes = this.displayNotes.slice(8, 16);
            notesLines[1].innerHTML = secondLineNotes.map(note => 
                `<span class="note-item">${note}</span>`
            ).join('');
        }
    }

    // گرفتن وضعیت پخش
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentNote: this.currentNoteIndex,
            totalNotes: this.songNotes.length,
            progress: (this.currentNoteIndex / this.songNotes.length) * 100,
            tempo: this.tempo
        };
    }

    // تنظیم سرعت پخش
    setTempo(newTempo) {
        this.tempo = Math.max(0.5, Math.min(2.0, newTempo));
        
        const tempoSlider = document.getElementById('tempoSlider');
        const tempoValue = document.getElementById('tempoValue');
        
        if (tempoSlider) {
            tempoSlider.value = this.tempo;
        }
        
        if (tempoValue) {
            tempoValue.textContent = this.tempo.toFixed(1) + 'x';
        }
    }

    // پخش نت منفرد از آهنگ
    playNoteByIndex(index) {
        if (index >= 0 && index < this.songNotes.length) {
            const noteData = this.songNotes[index];
            if (noteData.note !== 'rest' && window.piano) {
                window.piano.playNote(noteData.note);
                setTimeout(() => {
                    window.piano.stopNote(noteData.note);
                }, 500);
            }
        }
    }
}

// راه‌اندازی کلاس آهنگ بلاچو
document.addEventListener('DOMContentLoaded', () => {
    window.belachoSong = new BelachoSong();
    console.log('Belacho song initialized');
});

// اضافه کردن کلید میانبر برای پخش/توقف
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (window.belachoSong) {
            if (window.belachoSong.isPlaying) {
                window.belachoSong.pause();
            } else {
                window.belachoSong.play();
            }
        }
    }
});