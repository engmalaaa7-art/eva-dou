/**
 * Eva Dou - Luxury Voiceover Intro Component
 * Synchronizes audio playback with animated typography and full-screen glass overlay.
 */

class EvaIntroComponent {
  constructor() {
    this.overlay = document.getElementById('eva-intro-overlay');
    this.audio = document.getElementById('eva-intro-audio');
    this.startBtn = document.getElementById('eva-intro-start-btn');
    this.skipBtn = document.getElementById('eva-intro-skip-btn');
    this.replayBtn = document.getElementById('eva-intro-replay-trigger');
    
    this.isPlaying = false;
    this.autoTimer = null;

    this.init();
  }

  init() {
    if (!this.overlay) return;

    // Lock page scroll initially
    document.body.style.overflow = 'hidden';

    // Start Button listener
    if (this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startExperience();
      });
    }

    // Direct Overlay click listener for instant start
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

    // Optional Replay Trigger (in header or footer)
    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', () => {
        this.showAndPlay();
      });
    }

    // Audio end event listener
    if (this.audio) {
      this.audio.addEventListener('ended', () => {
        setTimeout(() => {
          this.dismissIntro();
        }, 600);
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('Audio playback encountered error or missing file:', e);
      });
    }

    // Escape key listener to skip
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('dismissed')) {
        this.dismissIntro();
      }
    });
  }

  startExperience() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.overlay) {
      this.overlay.classList.add('playing');
    }

    if (this.startBtn) {
      this.startBtn.style.display = 'none';
    }

    // Play Audio
    if (this.audio) {
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Autoplay prevented or audio blocked:', err);
          // Fallback auto dismiss after 6 seconds if audio fails
          this.autoTimer = setTimeout(() => {
            this.dismissIntro();
          }, 6000);
        });
      }
    } else {
      this.autoTimer = setTimeout(() => {
        this.dismissIntro();
      }, 5000);
    }

    // Safety fallback timer if audio duration is long or hung
    this.autoTimer = setTimeout(() => {
      this.dismissIntro();
    }, 12000);
  }

  dismissIntro() {
    if (!this.overlay) return;

    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
    }

    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }

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
