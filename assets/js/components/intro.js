/**
 * Eva Dou - Cinematic Sound Effect & Typewriter Motion Intro Engine
 * Robust Audio Engine designed for 100% Mobile & Desktop Compatibility (iOS Safari, Android Chrome, WebViews).
 * Synchronizes HTML5 Audio & Web Audio API fallback with typewriter animations and luxury chime sound effects.
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
    this.decodedAudioBuffer = null;
    this.bufferSourceNode = null;
    this.isAudioUnlocked = false;

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

    // Preload audio via Web Audio API buffer as backup
    this.preloadWebAudioBuffer();

    // Register user gesture unlocks (iOS Safari & Android autoplay requirement)
    const unlockAudio = (e) => {
      this.unlockMobileAudio();
    };

    ['click', 'touchend', 'pointerdown'].forEach(evt => {
      window.addEventListener(evt, unlockAudio, { passive: true, once: false });
    });

    // Start Button listener
    if (this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.unlockMobileAudio();
        this.startExperience();
      });
      this.startBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        this.unlockMobileAudio();
        this.startExperience();
      });
    }

    // Direct Overlay click listener
    this.overlay.addEventListener('click', (e) => {
      if (e.target !== this.skipBtn && !this.isPlaying) {
        this.unlockMobileAudio();
        this.startExperience();
      }
    });

    // Skip Button listener
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.dismissIntro();
      });
    }

    // Audio end listener for HTML5 Audio
    if (this.audio) {
      this.audio.addEventListener('ended', () => {
        this.onAudioEnded();
      });
    }

    // Escape key listener to skip
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('dismissed')) {
        this.dismissIntro();
      }
    });

    // Auto-attempt play on load (if browser permits)
    setTimeout(() => {
      this.attemptAutoPlay();
    }, 300);
  }

  /**
   * Initializes and unlocks Web Audio Context for Mobile Safari / Android
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

  /**
   * Universal Mobile Audio Unlocker
   * Plays 1ms silent sound buffer to permanently lift mobile browser autoplay restrictions
   */
  unlockMobileAudio() {
    if (this.isAudioUnlocked) return;

    this.initWebAudio();

    // Unlock HTML5 Audio
    if (this.audio) {
      try {
        this.audio.load();
      } catch (e) {}
    }

    // Unlock Web Audio Context via silent buffer
    if (this.audioCtx) {
      try {
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      } catch (e) {}
    }

    this.isAudioUnlocked = true;
  }

  /**
   * Fetch and decode intro MP3 for bulletproof Web Audio API fallback
   */
  preloadWebAudioBuffer() {
    try {
      fetch('assets/intro-voice.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          this.initWebAudio();
          if (this.audioCtx) {
            return this.audioCtx.decodeAudioData(arrayBuffer);
          }
        })
        .then(decodedData => {
          if (decodedData) {
            this.decodedAudioBuffer = decodedData;
          }
        })
        .catch(err => {
          console.warn('Web Audio buffer preload warning:', err);
        });
    } catch (e) {}
  }

  /**
   * Synthesize luxury gold chime sound effects
   */
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
        // Desktop autoplay succeeded
        this.onPlayStarted();
      }).catch(() => {
        console.log('Autoplay waiting for user gesture on mobile.');
      });
    }
  }

  /**
   * Main Start Experience Handler with Dual Audio Engine (HTML5 + Web Audio Fallback)
   */
  startExperience() {
    if (this.isPlaying) return;

    this.unlockMobileAudio();

    let html5PlaySuccess = false;

    // Strategy 1: Attempt HTML5 Audio element play
    if (this.audio) {
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          html5PlaySuccess = true;
          this.onPlayStarted();
        }).catch(err => {
          console.warn('HTML5 Audio playback blocked/failed. Trying Web Audio API fallback...', err);
          this.playWebAudioBufferFallback();
        });
      } else {
        html5PlaySuccess = true;
        this.onPlayStarted();
      }
    } else {
      this.playWebAudioBufferFallback();
    }
  }

  /**
   * Strategy 2: Web Audio API Buffer Playback Fallback for Mobile WebViews & iOS Safari
   */
  playWebAudioBufferFallback() {
    this.initWebAudio();

    if (this.audioCtx && this.decodedAudioBuffer) {
      try {
        if (this.bufferSourceNode) {
          this.bufferSourceNode.stop();
        }

        this.bufferSourceNode = this.audioCtx.createBufferSource();
        this.bufferSourceNode.buffer = this.decodedAudioBuffer;
        this.bufferSourceNode.connect(this.audioCtx.destination);
        
        this.bufferSourceNode.onended = () => {
          this.onAudioEnded();
        };

        this.bufferSourceNode.start(0);
        this.onPlayStarted();
        return;
      } catch (e) {
        console.warn('Web Audio buffer playback error:', e);
      }
    }

    // Final Graceful Fallback: Start visual animation even if browser blocks audio completely
    this.onPlayStarted();
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

    // Start typewriter animation synchronized with voiceover text
    this.startTypewriterAnimation();
  }

  startTypewriterAnimation() {
    if (!this.sloganElement) return;

    const textSpan = this.sloganElement.querySelector('.intro-typed-text');
    if (!textSpan) return;

    textSpan.textContent = '';
    let index = 0;

    if (this.typewriterInterval) clearInterval(this.typewriterInterval);

    // Calculate typing speed based on voiceover duration (~6.2s total)
    const speed = Math.floor(6200 / this.fullSloganText.length);

    this.typewriterInterval = setInterval(() => {
      if (index < this.fullSloganText.length) {
        const char = this.fullSloganText.charAt(index);
        textSpan.textContent += char;

        // Subtle audio tick on spaces / words
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

  onAudioEnded() {
    this.playLuxuryChime(880, 0.4); // End chime
    setTimeout(() => {
      this.dismissIntro();
    }, 1200);
  }

  dismissIntro() {
    if (!this.overlay) return;

    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
    }

    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }

    if (this.bufferSourceNode) {
      try {
        this.bufferSourceNode.stop();
      } catch (e) {}
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
    this.unlockMobileAudio();
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
