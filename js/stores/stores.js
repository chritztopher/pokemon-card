// Simple state management to replace Svelte stores
class Store {
  constructor(initialValue) {
    this.value = initialValue;
    this.subscribers = [];
  }

  set(newValue) {
    this.value = newValue;
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.value); // Call immediately with current value

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.value));
  }
}

// Active card store
export const activeCard = new Store(undefined);

// Orientation store with device orientation handling
class OrientationStore extends Store {
  constructor() {
    super({
      absolute: { alpha: 0, beta: 0, gamma: 0 },
      relative: { alpha: 0, beta: 0, gamma: 0 }
    });

    this.firstReading = true;
    this.baseOrientation = { alpha: 0, beta: 0, gamma: 0 };

    this.handleOrientation = this.handleOrientation.bind(this);
    this.start();
  }

  start() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", this.handleOrientation, true);
    }
  }

  stop() {
    window.removeEventListener("deviceorientation", this.handleOrientation, true);
  }

  getRawOrientation(e) {
    if (!e) {
      return { alpha: 0, beta: 0, gamma: 0 };
    }
    return { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 };
  }

  resetBaseOrientation() {
    this.firstReading = true;
    this.baseOrientation = { alpha: 0, beta: 0, gamma: 0 };
  }

  handleOrientation(e) {
    if (this.firstReading) {
      this.firstReading = false;
      this.baseOrientation = this.getRawOrientation(e);
    }

    const absolute = this.getRawOrientation(e);
    const relative = {
      alpha: absolute.alpha - this.baseOrientation.alpha,
      beta: absolute.beta - this.baseOrientation.beta,
      gamma: absolute.gamma - this.baseOrientation.gamma
    };

    this.set({ absolute, relative });
  }
}

export const orientation = new OrientationStore();
export const resetBaseOrientation = () => orientation.resetBaseOrientation();