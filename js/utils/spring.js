// Spring animation system to replace Svelte motion
export class Spring {
  constructor(initialValue, config = {}) {
    this.stiffness = config.stiffness || 0.066;
    this.damping = config.damping || 0.25;
    this.precision = config.precision || 0.01;

    this.currentValue = this.cloneValue(initialValue);
    this.targetValue = this.cloneValue(initialValue);
    this.velocity = this.getZeroVelocity(initialValue);

    this.subscribers = [];
    this.isAnimating = false;
    this.animationId = null;
  }

  cloneValue(value) {
    if (typeof value === 'object' && value !== null) {
      return { ...value };
    }
    return value;
  }

  getZeroVelocity(value) {
    if (typeof value === 'object' && value !== null) {
      const velocity = {};
      for (const key in value) {
        velocity[key] = 0;
      }
      return velocity;
    }
    return 0;
  }

  set(newValue, options = {}) {
    this.targetValue = this.cloneValue(newValue);

    if (options.hard) {
      this.currentValue = this.cloneValue(newValue);
      this.velocity = this.getZeroVelocity(newValue);
      this.notify();
      this.stopAnimation();
      return;
    }

    if (!this.isAnimating) {
      this.startAnimation();
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.currentValue);

    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.currentValue));
  }

  startAnimation() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const animate = () => {
      const finished = this.tick();

      if (finished) {
        this.stopAnimation();
      } else {
        this.animationId = requestAnimationFrame(animate);
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  tick() {
    let allSettled = true;

    if (typeof this.currentValue === 'object' && this.currentValue !== null) {
      // Handle object values (like {x: 0, y: 0})
      for (const key in this.currentValue) {
        const current = this.currentValue[key];
        const target = this.targetValue[key];
        const velocity = this.velocity[key];

        const force = (target - current) * this.stiffness;
        const damping = velocity * this.damping;
        const acceleration = force - damping;

        this.velocity[key] = velocity + acceleration;
        this.currentValue[key] = current + this.velocity[key];

        if (Math.abs(target - current) > this.precision || Math.abs(velocity) > this.precision) {
          allSettled = false;
        }
      }
    } else {
      // Handle primitive values
      const current = this.currentValue;
      const target = this.targetValue;
      const velocity = this.velocity;

      const force = (target - current) * this.stiffness;
      const damping = velocity * this.damping;
      const acceleration = force - damping;

      this.velocity = velocity + acceleration;
      this.currentValue = current + this.velocity;

      if (Math.abs(target - current) > this.precision || Math.abs(velocity) > this.precision) {
        allSettled = false;
      }
    }

    this.notify();
    return allSettled;
  }

  destroy() {
    this.stopAnimation();
    this.subscribers = [];
  }
}

export function spring(initialValue, config) {
  return new Spring(initialValue, config);
}