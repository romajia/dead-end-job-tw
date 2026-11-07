export type InputDevice = 'GAMEPAD' | 'KEYBOARD' | 'TOUCH';
export type ActionName = 'interact' | 'slash' | 'dodge' | 'hide' | 'breath' | 'tear' | 'start' | 'select';

export interface InputSnapshot {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  aimMode: 'stick' | 'pointer';
  mouseX: number;
  mouseY: number;
  actions: Record<ActionName, boolean>;
  pressed: Record<ActionName, boolean>;
  connected: boolean;
  gamepadName: string;
}

const ACTIONS: ActionName[] = ['interact', 'slash', 'dodge', 'hide', 'breath', 'tear', 'start', 'select'];

export function filterStick(x: number, y: number, deadzone = 0.15): { x: number; y: number; magnitude: number } {
  const magnitude = Math.hypot(x, y);
  if (magnitude < deadzone) return { x: 0, y: 0, magnitude: 0 };
  const normalized = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
  return { x: (x / magnitude) * normalized, y: (y / magnitude) * normalized, magnitude: normalized };
}

export class InputManager extends EventTarget {
  public currentDevice: InputDevice = 'KEYBOARD';
  private canvas: HTMLCanvasElement;
  private running = true;
  private rafId = 0;
  private keyState = new Set<string>();
  private mouseButtons = new Set<number>();
  private mouseX = 640;
  private mouseY = 360;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchSwipeTearUntil = 0;
  private touchMove = { x: 0, y: 0 };
  private touchAim = { x: 0, y: 0 };
  private touchActions = new Set<ActionName>();
  private previousActions: Record<ActionName, boolean> = this.emptyActions();
  private snapshot: InputSnapshot = this.emptySnapshot();
  private activeGamepad: Gamepad | null = null;
  private connected = false;
  private gamepadName = '';

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    window.addEventListener('keydown', this.onKeyDown, { passive: true });
    window.addEventListener('keyup', this.onKeyUp, { passive: true });
    window.addEventListener('blur', this.clearTransientInput);
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('contextmenu', this.onContextMenu);
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  private emptyActions(): Record<ActionName, boolean> {
    return { interact: false, slash: false, dodge: false, hide: false, breath: false, tear: false, start: false, select: false };
  }

  private emptySnapshot(): InputSnapshot {
    return { moveX: 0, moveY: 0, aimX: 1, aimY: 0, aimMode: 'stick', mouseX: 640, mouseY: 360, actions: this.emptyActions(), pressed: this.emptyActions(), connected: false, gamepadName: '' };
  }

  private setDevice(device: InputDevice): void {
    if (this.currentDevice === device) return;
    this.currentDevice = device;
    this.dispatchEvent(new CustomEvent('input-device-changed', { detail: device }));
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const key = event.code;
    const accepted = ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'KeyW', 'ArrowUp', 'KeyC', 'KeyE', 'KeyR', 'Space', 'ShiftLeft', 'ShiftRight', 'Escape', 'Tab'].includes(key);
    if (accepted && !event.repeat) this.setDevice('KEYBOARD');
    this.keyState.add(key);
  };

  private onKeyUp = (event: KeyboardEvent): void => { this.keyState.delete(event.code); };

  private onPointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    this.mouseY = ((event.clientY - rect.top) / rect.height) * 720;
    if (event.pointerType === 'touch') this.setDevice('TOUCH');
    else if (event.movementX !== 0 || event.movementY !== 0) this.setDevice('KEYBOARD');
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.setDevice('TOUCH');
      this.touchStartX = event.clientX;
      this.touchStartY = event.clientY;
    }
    else this.setDevice('KEYBOARD');
    this.mouseButtons.add(event.button);
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.mouseButtons.delete(event.button);
    if (event.pointerType === 'touch') {
      const deltaY = event.clientY - this.touchStartY;
      const deltaX = event.clientX - this.touchStartX;
      if (deltaY > 64 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) this.touchSwipeTearUntil = performance.now() + 100;
    }
  };
  private onContextMenu = (event: Event): void => { event.preventDefault(); };

  private onGamepadConnected = (event: GamepadEvent): void => {
    this.connected = true;
    this.gamepadName = event.gamepad.id || `控制器 ${event.gamepad.index + 1}`;
    this.activeGamepad = event.gamepad;
    this.dispatchEvent(new CustomEvent('gamepad-status', { detail: { connected: true, name: this.gamepadName } }));
  };

  private onGamepadDisconnected = (event: GamepadEvent): void => {
    this.connected = this.readGamepads().some((pad) => Boolean(pad?.connected));
    if (!this.connected) {
      this.activeGamepad = null;
      this.gamepadName = '';
      this.dispatchEvent(new CustomEvent('gamepad-status', { detail: { connected: false, name: '' } }));
    } else if (this.activeGamepad?.index === event.gamepad.index) {
      this.activeGamepad = this.readGamepads().find((pad): pad is Gamepad => Boolean(pad?.connected)) ?? null;
    }
  };

  private clearTransientInput = (): void => {
    this.keyState.clear();
    this.mouseButtons.clear();
    this.touchActions.clear();
    this.touchMove = { x: 0, y: 0 };
    this.touchAim = { x: 0, y: 0 };
  };

  private getGamepad(): Gamepad | null {
    const gamepads = this.readGamepads();
    if (this.activeGamepad?.connected) return gamepads[this.activeGamepad.index] ?? this.activeGamepad;
    const pad = gamepads.find((candidate): candidate is Gamepad => Boolean(candidate?.connected));
    this.activeGamepad = pad ?? null;
    this.connected = Boolean(pad);
    if (pad && !this.gamepadName) {
      this.gamepadName = pad.id || `控制器 ${pad.index + 1}`;
      this.dispatchEvent(new CustomEvent('gamepad-status', { detail: { connected: true, name: this.gamepadName } }));
    }
    return pad ?? null;
  }

  private readGamepads(): Array<Gamepad | null> {
    if (typeof navigator.getGamepads !== 'function') return [];
    try { return Array.from(navigator.getGamepads()); } catch { return []; }
  }

  private loop(): void {
    if (!this.running) return;
    const pad = this.getGamepad();
    let move = { x: this.touchMove.x, y: this.touchMove.y };
    let aim = { x: this.touchAim.x, y: this.touchAim.y };
    let aimMode: 'stick' | 'pointer' = 'stick';
    const actions = this.emptyActions();

    const keyLeft = this.keyState.has('KeyA') || this.keyState.has('ArrowLeft');
    const keyRight = this.keyState.has('KeyD') || this.keyState.has('ArrowRight');
    if (keyLeft || keyRight) move.x = (keyRight ? 1 : 0) - (keyLeft ? 1 : 0);
    if (this.keyState.has('KeyW') || this.keyState.has('ArrowUp')) actions.hide = true;
    if (this.keyState.has('KeyE')) actions.interact = true;
    if (this.keyState.has('Space') || this.mouseButtons.has(0)) actions.slash = true;
    if (this.keyState.has('ShiftLeft') || this.keyState.has('ShiftRight')) actions.dodge = true;
    if (this.keyState.has('KeyC') || this.mouseButtons.has(2)) actions.breath = true;
    if (this.keyState.has('KeyR')) actions.tear = true;
    if (this.keyState.has('Escape')) actions.start = true;
    if (this.keyState.has('Tab')) actions.select = true;
    if (performance.now() < this.touchSwipeTearUntil) actions.tear = true;
    if (this.mouseX >= 0 && this.mouseY >= 0) aimMode = 'pointer';

    if (pad) {
      const leftStick = filterStick(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      const rightStick = filterStick(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
      const dpadX = (pad.buttons[15]?.pressed ? 1 : 0) - (pad.buttons[14]?.pressed ? 1 : 0);
      const dpadY = (pad.buttons[13]?.pressed ? 1 : 0) - (pad.buttons[12]?.pressed ? 1 : 0);
      if (leftStick.magnitude > 0 || dpadX !== 0 || dpadY !== 0) move = { x: leftStick.x || dpadX, y: leftStick.y || dpadY };
      if (rightStick.magnitude > 0) { aim = { x: rightStick.x, y: rightStick.y }; aimMode = 'stick'; }
      actions.interact ||= Boolean(pad.buttons[0]?.pressed);
      actions.dodge ||= Boolean(pad.buttons[1]?.pressed);
      actions.slash ||= Boolean(pad.buttons[2]?.pressed);
      actions.hide ||= Boolean(pad.buttons[3]?.pressed);
      actions.hide ||= Boolean(pad.buttons[4]?.pressed);
      actions.tear ||= Boolean(pad.buttons[5]?.pressed);
      actions.select ||= Boolean(pad.buttons[8]?.pressed);
      actions.start ||= Boolean(pad.buttons[9]?.pressed);
      actions.breath ||= (pad.buttons[6]?.value ?? 0) > 0.2 || (pad.buttons[7]?.value ?? 0) > 0.2;
      const hasGamepadInput = leftStick.magnitude > 0.15 || rightStick.magnitude > 0.15 || dpadX !== 0 || dpadY !== 0 || ACTIONS.some((action) => actions[action]);
      if (hasGamepadInput) this.setDevice('GAMEPAD');
    }

    if (this.currentDevice === 'KEYBOARD' && aimMode === 'pointer') {
      const dx = this.mouseX - 640;
      const dy = this.mouseY - 360;
      const length = Math.hypot(dx, dy);
      if (length > 12) aim = { x: dx / length, y: dy / length };
    }
    for (const action of this.touchActions) actions[action] = true;

    const pressed = this.emptyActions();
    for (const action of ACTIONS) pressed[action] = actions[action] && !this.previousActions[action];
    this.previousActions = { ...actions };
    this.snapshot = {
      moveX: Math.max(-1, Math.min(1, move.x)), moveY: Math.max(-1, Math.min(1, move.y)),
      aimX: aim.x, aimY: aim.y, aimMode, mouseX: this.mouseX, mouseY: this.mouseY,
      actions, pressed, connected: this.connected, gamepadName: this.gamepadName,
    };
    this.rafId = requestAnimationFrame(this.loop);
  }

  public read(): InputSnapshot { return this.snapshot; }
  public getDevice(): InputDevice { return this.currentDevice; }

  public setTouchStick(kind: 'move' | 'aim', x: number, y: number): void {
    this.setDevice('TOUCH');
    const filtered = filterStick(x, y, 0.08);
    if (kind === 'move') this.touchMove = { x: filtered.x, y: filtered.y };
    else this.touchAim = { x: filtered.x, y: filtered.y };
  }

  public setTouchAction(action: ActionName, active: boolean): void {
    this.setDevice('TOUCH');
    if (active) this.touchActions.add(action);
    else this.touchActions.delete(action);
  }

  public triggerRumble(duration: number, weakMagnitude: number, strongMagnitude: number): void {
    const pad = this.getGamepad();
    try {
      const actuator = pad?.vibrationActuator;
      if (actuator?.playEffect) {
        void actuator.playEffect('dual-rumble', { startDelay: 0, duration, weakMagnitude, strongMagnitude }).catch(() => this.fallbackRumble(duration, weakMagnitude, strongMagnitude));
      } else {
        this.fallbackRumble(duration, weakMagnitude, strongMagnitude);
      }
    } catch {
      this.fallbackRumble(duration, weakMagnitude, strongMagnitude);
    }
  }

  private fallbackRumble(duration: number, weakMagnitude: number, strongMagnitude: number): void {
    this.dispatchEvent(new CustomEvent('rumble-fallback', { detail: { duration, intensity: Math.min(0.04, strongMagnitude * 0.011 + weakMagnitude * 0.004) } }));
  }

  public destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearTransientInput);
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }
}
