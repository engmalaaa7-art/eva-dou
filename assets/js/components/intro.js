/**
 * Eva Dou - Cinematic Sound Effect & Typewriter Motion Intro Engine
 * Synchronizes audio playback with Web Audio sound effects, typewriter letter-by-letter animations, and gold motion graphics.
 */

class EvaIntroComponent {
  constructor() {
    this.overlay = document.getElementById('eva-intro-overlay');
    this.audio = document.getElementById('eva-intro-audio');
    this.sloganElement = document.getElementById('eva-intro-slogan');
    this.startBtn = document.getElementById('eva-intro-start-btn');
    this.skipBtn = document.getElementById('eva-intro-skip-btn');
    this.replayBtn = document.getElementById('eva-intro-replay-trigger');
    
    this.fullSloganText = `"Not just a fragrance… it’s a story of femininity called Eva Dou"`;
    this.isPlaying = false;
    this.typewriterInterval = null;
    this.audioCtx = null;

    this.init();
  }

  init() {
    if (!this.overlay) return;

    // Lock page scroll initially
    document.body.style.overflow = 'hidden';
    this.overlay.style.display = 'flex';
    this.overlay.classList.remove('dismissed');

    // Prepare typewriter container
    if (this.sloganElement) {
      this.sloganElement.innerHTML = `<span class="intro-typed-text"></span><span class="intro-cursor">|</span>`;
    }

    // Bind interaction events
    const handleFirstTouch = () => {
      if (!this.isPlaying) {
        this.startExperience();
      }
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('pointerdown', handleFirstTouch, { once: true });
    window.addEventListener('touchstart', handleFirstTouch, { once: true });

    // Start Button listener
    if (this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startExperience();
      });
    }

    // Direct Overlay click listener
    this.overlay.addEventListener('click', (e) => {
      if (e.target !== this.skipBtn && !this.isPlaying) {
        this.startExperience();
      }
    });

    // Skip Button listener
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissIntro();
      });
    }

    // Audio end listener
    if (this.audio) {
      this.audio.addEventListener('ended', () => {
        this.playLuxuryChime(880, 0.4); // End chime
        setTimeout(() => {
          this.dismissIntro();
        }, 1200);
      });
    }

    // Escape key listener to skip
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('dismissed')) {
        this.dismissIntro();
      }
    });

    // Auto-attempt play on load
    setTimeout(() => {
      this.attemptAutoPlay();
    }, 300);
  }

  /**
   * Synthesize luxury gold sound effects using Web Audio API
   */
  initWebAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  playLuxuryChime(freq = 523.25, duration = 0.3) {
    try {
      this.initWebAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playSparkleSound() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playLuxuryChime(freq, 0.5);
      }, idx * 90);
    });
  }

  attemptAutoPlay() {
    if (!this.audio || this.isPlaying) return;

    this.audio.currentTime = 0;
    const promise = this.audio.play();

    if (promise !== undefined) {
      promise.then(() => {
        // Autoplay succeeded
        this.onPlayStarted();
      }).catch(() => {
        console.log('Autoplay waiting for user touch/click.');
      });
    }
  }

  startExperience() {
    if (this.isPlaying) return;
    this.initWebAudio();

    if (this.audio) {
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.onPlayStarted();
        }).catch(err => {
          console.warn('Audio start error:', err);
          this.onPlayStarted();
        });
      } else {
        this.onPlayStarted();
      }
    } else {
      this.onPlayStarted();
    }
  }

  onPlayStarted() {
    this.isPlaying = true;

    if (this.overlay) {
      this.overlay.classList.add('playing');
    }

    if (this.startBtn) {
      this.startBtn.style.display = 'none';
    }

    // Play sparkling sound effect
    this.playSparkleSound();

    // Start typewriter animation synchronized with text
    this.startTypewriterAnimation();
  }

  startTypewriterAnimation() {
    if (!this.sloganElement) return;

    const textSpan = this.sloganElement.querySelector('.intro-typed-text');
    if (!textSpan) return;

    textSpan.textContent = '';
    let index = 0;

    if (this.typewriterInterval) clearInterval(this.typewriterInterval);

    // Calculate typing speed based on voiceover duration (~6-7s)
    const speed = Math.floor(6200 / this.fullSloganText.length);

    this.typewriterInterval = setInterval(() => {
      if (index < this.fullSloganText.length) {
        const char = this.fullSloganText.charAt(index);
        textSpan.textContent += char;

        // Subtle audio tick on key words/spaces
        if (char === ' ' || index % 5 === 0) {
          this.playLuxuryChime(600 + (index * 6), 0.12);
        }

        index++;
      } else {
        clearInterval(this.typewriterInterval);
        this.playSparkleSound();
      }
    }, speed);
  }

  dismissIntro() {
    if (!this.overlay) return;

    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
    }

    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }

    this.playLuxuryChime(440, 0.4);

    this.overlay.classList.add('dismissed');
    document.body.style.overflow = '';

    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 800);
  }

  showAndPlay() {
    if (!this.overlay) return;
    this.isPlaying = false;
    this.overlay.style.display = 'flex';
    this.overlay.classList.remove('dismissed', 'playing');
    if (this.startBtn) this.startBtn.style.display = 'inline-flex';
    document.body.style.overflow = 'hidden';
    this.startExperience();
  }
}

// Global Singleton Export
if (typeof window !== 'undefined') {
  window.EvaIntroComponent = EvaIntroComponent;
  window.playEvaIntro = function() {
    if (window.evaIntroInstance) {
      window.evaIntroInstance.showAndPlay();
    }
  };
}
