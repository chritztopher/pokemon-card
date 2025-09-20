import { spring } from '../utils/spring.js';
import { round, clamp, adjust } from '../utils/math.js';
import { activeCard, orientation, resetBaseOrientation } from '../stores/stores.js';

export class PokemonCard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      id: options.id || "",
      name: options.name || "",
      number: options.number || "",
      set: options.set || "",
      types: options.types || [],
      subtypes: options.subtypes || "basic",
      supertype: options.supertype || "pokémon",
      rarity: options.rarity || "common",
      img: options.img || "",
      back: options.back || "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg",
      foil: options.foil || "",
      mask: options.mask || "",
      showcase: options.showcase || false
    };

    this.randomSeed = {
      x: Math.random(),
      y: Math.random()
    };

    this.cosmosPosition = {
      x: Math.floor(this.randomSeed.x * 734),
      y: Math.floor(this.randomSeed.y * 1280)
    };

    this.isTrainerGallery = false;
    this.repositionTimer = null;
    this.active = false;
    this.interacting = false;
    this.firstPop = true;
    this.loading = true;
    this.isVisible = document.visibilityState === "visible";

    // Spring animation settings
    this.springInteractSettings = { stiffness: 0.066, damping: 0.25 };
    this.springPopoverSettings = { stiffness: 0.033, damping: 0.45 };

    // Initialize springs
    this.springRotate = spring({ x: 0, y: 0 }, this.springInteractSettings);
    this.springGlare = spring({ x: 50, y: 50, o: 0 }, this.springInteractSettings);
    this.springBackground = spring({ x: 50, y: 50 }, this.springInteractSettings);
    this.springRotateDelta = spring({ x: 0, y: 0 }, this.springPopoverSettings);
    this.springTranslate = spring({ x: 0, y: 0 }, this.springPopoverSettings);
    this.springScale = spring(1, this.springPopoverSettings);

    // Showcase animation variables
    this.showcaseInterval = null;
    this.showcaseTimerStart = null;
    this.showcaseTimerEnd = null;
    this.showcaseRunning = this.options.showcase;

    // Bind methods
    this.interact = this.interact.bind(this);
    this.interactEnd = this.interactEnd.bind(this);
    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.reposition = this.reposition.bind(this);
    this.imageLoader = this.imageLoader.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.init();
  }

  init() {
    this.processOptions();
    this.createHTML();
    this.setupEventListeners();
    this.setupStoreSubscriptions();
    this.startShowcase();
  }

  processOptions() {
    this.options.rarity = this.options.rarity.toLowerCase();
    this.options.supertype = this.options.supertype.toLowerCase();
    this.options.number = this.options.number.toLowerCase();

    this.isTrainerGallery = !!this.options.number.match(/^[tg]g/i) ||
                           !!(this.options.id === "swshp-SWSH076" || this.options.id === "swshp-SWSH077");

    if (Array.isArray(this.options.types)) {
      this.options.types = this.options.types.join(" ").toLowerCase();
    }
    if (Array.isArray(this.options.subtypes)) {
      this.options.subtypes = this.options.subtypes.join(" ").toLowerCase();
    }

    this.front_img = (this.options.img.startsWith("http") || this.options.img.startsWith("/"))
      ? this.options.img
      : "https://images.pokemontcg.io/" + this.options.img;
  }

  createHTML() {
    const staticStyles = `
      --seedx: ${this.randomSeed.x};
      --seedy: ${this.randomSeed.y};
      --cosmosbg: ${this.cosmosPosition.x}px ${this.cosmosPosition.y}px;
    `;

    const foilStyles = this.options.mask || this.options.foil ? `
      --mask: url(${this.options.mask});
      --foil: url(${this.options.foil});
    ` : '';

    this.container.innerHTML = `
      <div class="card ${this.options.types} interactive ${this.loading ? 'loading' : ''} ${this.options.mask ? 'masked' : ''}"
           data-number="${this.options.number}"
           data-set="${this.options.set}"
           data-subtypes="${this.options.subtypes}"
           data-supertype="${this.options.supertype}"
           data-rarity="${this.options.rarity}"
           data-trainer-gallery="${this.isTrainerGallery}">
        <div class="card__translater">
          <button class="card__rotator"
                  aria-label="Expand the Pokemon Card; ${this.options.name}."
                  tabindex="0">
            <img class="card__back"
                 src="${this.options.back}"
                 alt="The back of a Pokemon Card, a Pokeball in the center with Pokemon logo above and below"
                 loading="lazy"
                 width="660"
                 height="921" />
            <div class="card__front" style="${staticStyles}${foilStyles}">
              <img src="${this.front_img}"
                   alt="Front design of the ${this.options.name} Pokemon Card, with the stats and info around the edge"
                   loading="lazy"
                   width="660"
                   height="921" />
              <div class="card__shine"></div>
              <div class="card__glare"></div>
            </div>
          </button>
        </div>
      </div>
    `;

    this.cardElement = this.container.querySelector('.card');
    this.rotatorElement = this.container.querySelector('.card__rotator');
    this.frontImageElement = this.container.querySelector('.card__front img');
  }

  setupEventListeners() {
    this.rotatorElement.addEventListener('click', this.activate);
    this.rotatorElement.addEventListener('pointermove', this.interact);
    this.rotatorElement.addEventListener('mouseout', this.interactEnd);
    this.rotatorElement.addEventListener('blur', this.deactivate);
    this.frontImageElement.addEventListener('load', this.imageLoader);

    window.addEventListener('scroll', this.reposition);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  setupStoreSubscriptions() {
    // Subscribe to spring values and update CSS variables
    this.springRotate.subscribe(value => {
      this.updateCSSVariable('--rotate-x', `${value.x + this.springRotateDelta.currentValue.x}deg`);
      this.updateCSSVariable('--rotate-y', `${value.y + this.springRotateDelta.currentValue.y}deg`);
    });

    this.springGlare.subscribe(value => {
      this.updateCSSVariable('--pointer-x', `${value.x}%`);
      this.updateCSSVariable('--pointer-y', `${value.y}%`);
      this.updateCSSVariable('--card-opacity', value.o);

      const fromCenter = clamp(Math.sqrt(
        (value.y - 50) * (value.y - 50) +
        (value.x - 50) * (value.x - 50)
      ) / 50, 0, 1);

      this.updateCSSVariable('--pointer-from-center', fromCenter);
      this.updateCSSVariable('--pointer-from-top', value.y / 100);
      this.updateCSSVariable('--pointer-from-left', value.x / 100);
    });

    this.springBackground.subscribe(value => {
      this.updateCSSVariable('--background-x', `${value.x}%`);
      this.updateCSSVariable('--background-y', `${value.y}%`);
    });

    this.springScale.subscribe(value => {
      this.updateCSSVariable('--card-scale', value);
    });

    this.springTranslate.subscribe(value => {
      this.updateCSSVariable('--translate-x', `${value.x}px`);
      this.updateCSSVariable('--translate-y', `${value.y}px`);
    });

    this.springRotateDelta.subscribe(value => {
      this.updateCSSVariable('--rotate-x', `${this.springRotate.currentValue.x + value.x}deg`);
      this.updateCSSVariable('--rotate-y', `${this.springRotate.currentValue.y + value.y}deg`);
    });

    // Subscribe to active card changes
    activeCard.subscribe(card => {
      if (card && card === this) {
        this.popover();
        this.active = true;
        this.cardElement.classList.add('active');
      } else {
        this.retreat();
        this.active = false;
        this.cardElement.classList.remove('active');
      }
    });

    // Subscribe to orientation changes
    orientation.subscribe(orientationData => {
      if (activeCard.value && activeCard.value === this) {
        this.interacting = true;
        this.orientate(orientationData);
      }
    });
  }

  updateCSSVariable(property, value) {
    this.cardElement.style.setProperty(property, value);
  }

  endShowcase() {
    if (this.showcaseRunning) {
      clearTimeout(this.showcaseTimerEnd);
      clearTimeout(this.showcaseTimerStart);
      clearInterval(this.showcaseInterval);
      this.showcaseRunning = false;
    }
  }

  interact(e) {
    this.endShowcase();

    if (!this.isVisible) {
      this.interacting = false;
      return;
    }

    if (activeCard.value && activeCard.value !== this) {
      this.interacting = false;
      return;
    }

    this.interacting = true;
    this.cardElement.classList.add('interacting');

    if (e.type === "touchmove") {
      e.clientX = e.touches[0].clientX;
      e.clientY = e.touches[0].clientY;
    }

    const rect = e.target.getBoundingClientRect();
    const absolute = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const percent = {
      x: clamp(round((100 / rect.width) * absolute.x)),
      y: clamp(round((100 / rect.height) * absolute.y)),
    };
    const center = {
      x: percent.x - 50,
      y: percent.y - 50,
    };

    this.updateSprings({
      x: adjust(percent.x, 0, 100, 37, 63),
      y: adjust(percent.y, 0, 100, 33, 67),
    }, {
      x: round(-(center.x / 6)),
      y: round(center.y / 4),
    }, {
      x: round(percent.x),
      y: round(percent.y),
      o: 1,
    });
  }

  interactEnd(delay = 500) {
    setTimeout(() => {
      const snapStiff = 0.01;
      const snapDamp = 0.06;
      this.interacting = false;
      this.cardElement.classList.remove('interacting');

      this.springRotate.stiffness = snapStiff;
      this.springRotate.damping = snapDamp;
      this.springRotate.set({ x: 0, y: 0 }, { soft: 1 });

      this.springGlare.stiffness = snapStiff;
      this.springGlare.damping = snapDamp;
      this.springGlare.set({ x: 50, y: 50, o: 0 }, { soft: 1 });

      this.springBackground.stiffness = snapStiff;
      this.springBackground.damping = snapDamp;
      this.springBackground.set({ x: 50, y: 50 }, { soft: 1 });
    }, delay);
  }

  activate() {
    if (activeCard.value && activeCard.value === this) {
      activeCard.set(undefined);
    } else {
      activeCard.set(this);
      resetBaseOrientation();
    }
  }

  deactivate() {
    this.interactEnd();
    activeCard.set(undefined);
  }

  reposition() {
    clearTimeout(this.repositionTimer);
    this.repositionTimer = setTimeout(() => {
      if (activeCard.value && activeCard.value === this) {
        this.setCenter();
      }
    }, 300);
  }

  setCenter() {
    const rect = this.cardElement.getBoundingClientRect();
    const view = document.documentElement;

    const delta = {
      x: round(view.clientWidth / 2 - rect.x - rect.width / 2),
      y: round(view.clientHeight / 2 - rect.y - rect.height / 2),
    };

    this.springTranslate.set({
      x: delta.x,
      y: delta.y,
    });
  }

  popover() {
    const rect = this.cardElement.getBoundingClientRect();
    let delay = 100;
    let scaleW = (window.innerWidth / rect.width) * 0.9;
    let scaleH = (window.innerHeight / rect.height) * 0.9;
    let scaleF = 1.75;

    this.setCenter();

    if (this.firstPop) {
      delay = 1000;
      this.springRotateDelta.set({
        x: 360,
        y: 0,
      });
    }

    this.firstPop = false;
    this.springScale.set(Math.min(scaleW, scaleH, scaleF));
    this.interactEnd(delay);
  }

  retreat() {
    this.springScale.set(1, { soft: true });
    this.springTranslate.set({ x: 0, y: 0 }, { soft: true });
    this.springRotateDelta.set({ x: 0, y: 0 }, { soft: true });
    this.interactEnd(100);
  }

  reset() {
    this.interactEnd(0);
    this.springScale.set(1, { hard: true });
    this.springTranslate.set({ x: 0, y: 0 }, { hard: true });
    this.springRotateDelta.set({ x: 0, y: 0 }, { hard: true });
    this.springRotate.set({ x: 0, y: 0 }, { hard: true });
  }

  orientate(e) {
    const x = e.relative.gamma;
    const y = e.relative.beta;
    const limit = { x: 16, y: 18 };

    const degrees = {
      x: clamp(x, -limit.x, limit.x),
      y: clamp(y, -limit.y, limit.y)
    };

    this.updateSprings({
      x: adjust(degrees.x, -limit.x, limit.x, 37, 63),
      y: adjust(degrees.y, -limit.y, limit.y, 33, 67),
    }, {
      x: round(degrees.x * -1),
      y: round(degrees.y),
    }, {
      x: adjust(degrees.x, -limit.x, limit.x, 0, 100),
      y: adjust(degrees.y, -limit.y, limit.y, 0, 100),
      o: 1,
    });
  }

  updateSprings(background, rotate, glare) {
    this.springBackground.stiffness = this.springInteractSettings.stiffness;
    this.springBackground.damping = this.springInteractSettings.damping;
    this.springRotate.stiffness = this.springInteractSettings.stiffness;
    this.springRotate.damping = this.springInteractSettings.damping;
    this.springGlare.stiffness = this.springInteractSettings.stiffness;
    this.springGlare.damping = this.springInteractSettings.damping;

    this.springBackground.set(background);
    this.springRotate.set(rotate);
    this.springGlare.set(glare);
  }

  handleVisibilityChange() {
    this.isVisible = document.visibilityState === "visible";
    this.endShowcase();
    this.reset();
  }

  imageLoader() {
    this.loading = false;
    this.cardElement.classList.remove('loading');
  }

  startShowcase() {
    if (this.options.showcase && this.isVisible) {
      const s = 0.02;
      const d = 0.5;
      let r = 0;

      this.showcaseTimerStart = setTimeout(() => {
        this.interacting = true;
        this.active = true;
        this.cardElement.classList.add('interacting', 'active');

        this.springRotate.stiffness = s;
        this.springRotate.damping = d;
        this.springGlare.stiffness = s;
        this.springGlare.damping = d;
        this.springBackground.stiffness = s;
        this.springBackground.damping = d;

        if (this.isVisible) {
          this.showcaseInterval = setInterval(() => {
            r += 0.05;
            this.springRotate.set({ x: Math.sin(r) * 25, y: Math.cos(r) * 25 });
            this.springGlare.set({
              x: 55 + Math.sin(r) * 55,
              y: 55 + Math.cos(r) * 55,
              o: 0.8,
            });
            this.springBackground.set({
              x: 20 + Math.sin(r) * 20,
              y: 20 + Math.cos(r) * 20,
            });
          }, 20);

          this.showcaseTimerEnd = setTimeout(() => {
            clearInterval(this.showcaseInterval);
            this.interactEnd(0);
          }, 4000);
        } else {
          this.interacting = false;
          this.active = false;
          this.cardElement.classList.remove('interacting', 'active');
        }
      }, 2000);
    }
  }

  destroy() {
    // Clean up event listeners
    this.rotatorElement.removeEventListener('click', this.activate);
    this.rotatorElement.removeEventListener('pointermove', this.interact);
    this.rotatorElement.removeEventListener('mouseout', this.interactEnd);
    this.rotatorElement.removeEventListener('blur', this.deactivate);
    this.frontImageElement.removeEventListener('load', this.imageLoader);
    window.removeEventListener('scroll', this.reposition);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Clean up springs
    this.springRotate.destroy();
    this.springGlare.destroy();
    this.springBackground.destroy();
    this.springRotateDelta.destroy();
    this.springTranslate.destroy();
    this.springScale.destroy();

    // Clean up showcase timers
    this.endShowcase();

    // Clear the container
    this.container.innerHTML = '';
  }
}