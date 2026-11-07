import { InputManager, type ActionName, type InputDevice } from '../systems/InputManager';
import { PROMPTS } from '../config/GameConstants';
import { Level1Scene } from './Level1Scene';

interface CalendarDetail { page: 'rules' | 'final'; rules: readonly string[]; }
interface GamepadDetail { connected: boolean; name: string; }

export class UIOverlayScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private level!: Level1Scene;
  private hud!: HTMLElement;
  private menu!: HTMLElement;
  private ending!: HTMLElement;
  private calendar!: HTMLElement;
  private touchControls!: HTMLElement;
  private prompt!: HTMLElement;
  private dialogue!: HTMLElement;
  private gamepadIndicator!: HTMLElement;
  private calendarButton!: HTMLButtonElement;
  private lastDevice: InputDevice = 'KEYBOARD';
  private touchHandlers: Array<() => void> = [];
  private pulseTimer = 0;

  constructor() { super('UIOverlayScene'); }

  create(): void {
    this.inputManager = this.game.registry.get('inputManager') as InputManager;
    this.level = this.game.scene.getScene('Level1Scene') as Level1Scene;
    this.hud = document.getElementById('hud')!;
    this.menu = document.getElementById('menu-screen')!;
    this.ending = document.getElementById('ending-screen')!;
    this.calendar = document.getElementById('calendar-modal')!;
    this.touchControls = document.getElementById('touch-controls')!;
    this.prompt = document.getElementById('prompt')!;
    this.dialogue = document.getElementById('dialogue')!;
    this.gamepadIndicator = document.getElementById('gamepad-indicator')!;
    this.calendarButton = document.getElementById('calendar-continue') as HTMLButtonElement;
    this.menu.style.display = 'none';
    this.ending.style.display = 'none';
    this.hud.style.display = 'block';
    this.calendar.style.display = 'none';
    this.dialogue.style.display = 'none';
    this.lastDevice = this.inputManager.getDevice();
    this.setGamepadStatus({ connected: this.inputManager.read().connected, name: this.inputManager.read().gamepadName });
    this.attachTouchControls();

    const calendarOpen = (event: Event): void => this.openCalendar((event as CustomEvent<CalendarDetail>).detail);
    const calendarClose = (): void => this.closeCalendar();
    const dialogue = (event: Event): void => {
      const message = (event as CustomEvent<string>).detail;
      this.dialogue.textContent = message;
      this.dialogue.style.display = message ? 'block' : 'none';
    };
    const gamepadStatus = (event: Event): void => this.setGamepadStatus((event as CustomEvent<GamepadDetail>).detail);
    const rumbleFallback = (event: Event): void => {
      const detail = (event as CustomEvent<{ duration: number }>).detail;
      this.hud.classList.add('rumble');
      if (this.pulseTimer) window.clearTimeout(this.pulseTimer);
      this.pulseTimer = window.setTimeout(() => this.hud.classList.remove('rumble'), Math.max(140, detail?.duration ?? 180));
    };
    this.game.events.on('calendar-open', calendarOpen);
    this.game.events.on('calendar-close', calendarClose);
    this.game.events.on('dialogue', dialogue);
    this.inputManager.addEventListener('gamepad-status', gamepadStatus as EventListener);
    this.inputManager.addEventListener('rumble-fallback', rumbleFallback as EventListener);
    this.calendarButton.onclick = () => this.level.closeCalendarFromUI();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('calendar-open', calendarOpen);
      this.game.events.off('calendar-close', calendarClose);
      this.game.events.off('dialogue', dialogue);
      this.inputManager.removeEventListener('gamepad-status', gamepadStatus as EventListener);
      this.inputManager.removeEventListener('rumble-fallback', rumbleFallback as EventListener);
      if (this.pulseTimer) window.clearTimeout(this.pulseTimer);
      for (const clean of this.touchHandlers) clean();
      this.touchHandlers = [];
      this.calendarButton.onclick = null;
      this.hud.style.display = 'none';
      this.touchControls.style.display = 'none';
      this.calendar.style.display = 'none';
      this.dialogue.style.display = 'none';
    });
  }

  private openCalendar(detail: CalendarDetail): void {
    const content = document.getElementById('calendar-content');
    if (!content) return;
    const title = detail.page === 'final' ? '農民曆封底夾層・店長真相字條' : '夜班交接守則（紅字日曆）';
    const heading = document.querySelector('#calendar-sheet h2');
    if (heading) heading.textContent = title;
    content.replaceChildren();
    detail.rules.forEach((rule, index) => {
      const paragraph = document.createElement('p');
      paragraph.className = 'rule';
      paragraph.textContent = `${detail.page === 'final' ? '封底真相' : `守則 ${index + 1}`}：${rule}`;
      content.append(paragraph);
    });
    this.calendar.style.display = 'flex';
    this.touchControls.style.display = 'none';
  }

  private closeCalendar(): void {
    this.calendar.style.display = 'none';
    this.updateTouchControls();
  }

  private setGamepadStatus(detail: GamepadDetail): void {
    if (!detail) return;
    this.gamepadIndicator.textContent = detail.connected ? `● 手把已連線・${detail.name.slice(0, 28)}` : '○ 手把未連線';
    this.gamepadIndicator.classList.toggle('connected', detail.connected);
  }

  private updateTouchControls(): void {
    const touchActive = this.inputManager.getDevice() === 'TOUCH' && this.calendar.style.display !== 'flex';
    this.touchControls.style.display = touchActive ? 'block' : 'none';
  }

  private attachTouchControls(): void {
    const attachPad = (elementId: string, kind: 'move' | 'aim'): void => {
      const element = document.getElementById(elementId);
      const knob = element?.querySelector('.pad-knob') as HTMLElement | null;
      if (!element || !knob) return;
      let activePointer: number | null = null;
      const update = (event: PointerEvent): void => {
        const rect = element.getBoundingClientRect();
        const radius = Math.min(rect.width, rect.height) * 0.38;
        let x = (event.clientX - (rect.left + rect.width / 2)) / radius;
        let y = (event.clientY - (rect.top + rect.height / 2)) / radius;
        const magnitude = Math.hypot(x, y);
        if (magnitude > 1) { x /= magnitude; y /= magnitude; }
        knob.style.transform = `translate(${x * radius * 0.62}px, ${y * radius * 0.62}px)`;
        this.inputManager.setTouchStick(kind, x, y);
      };
      const down = (event: PointerEvent): void => { event.preventDefault(); activePointer = event.pointerId; element.setPointerCapture(event.pointerId); update(event); };
      const move = (event: PointerEvent): void => { if (event.pointerId === activePointer) update(event); };
      const up = (event: PointerEvent): void => {
        if (event.pointerId !== activePointer) return;
        activePointer = null;
        knob.style.transform = 'translate(0, 0)';
        this.inputManager.setTouchStick(kind, 0, 0);
      };
      element.addEventListener('pointerdown', down);
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerup', up);
      element.addEventListener('pointercancel', up);
      this.touchHandlers.push(() => { element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move); element.removeEventListener('pointerup', up); element.removeEventListener('pointercancel', up); });
    };
    attachPad('move-pad', 'move');
    attachPad('aim-pad', 'aim');

    const mapping: Record<string, ActionName> = { interact: 'interact', slash: 'slash', dodge: 'dodge', hide: 'hide', breath: 'breath', tear: 'tear' };
    document.querySelectorAll<HTMLButtonElement>('.touch-btn[data-action]').forEach((button) => {
      const action = mapping[button.dataset.action ?? ''];
      if (!action) return;
      const down = (event: PointerEvent): void => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        button.classList.add('active');
        this.inputManager.setTouchAction(action, true);
      };
      const up = (event: PointerEvent): void => {
        event.preventDefault();
        button.classList.remove('active');
        this.inputManager.setTouchAction(action, false);
      };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up as EventListener);
      this.touchHandlers.push(() => { button.removeEventListener('pointerdown', down); button.removeEventListener('pointerup', up); button.removeEventListener('pointercancel', up); button.removeEventListener('lostpointercapture', up as EventListener); });
    });
  }

  update(): void {
    if (!this.level?.sys.isActive()) return;
    const snapshot = this.inputManager.read();
    if (snapshot.pressed.interact && this.level.calendarModalOpen || snapshot.pressed.tear && this.level.calendarModalOpen) this.level.closeCalendarFromUI();
    const state = this.level.getHUDState();
    document.getElementById('night-label')!.textContent = state.phase;
    document.getElementById('objective')!.textContent = state.objective;
    document.getElementById('clock-label')!.textContent = state.clock;
    document.getElementById('hp-label')!.textContent = `阿財 HP ${state.hp} / ${state.maxHp}`;
    document.getElementById('hp-fill')!.style.width = `${(state.hp / state.maxHp) * 100}%`;
    document.getElementById('oxygen-label')!.textContent = `憋氣 ${state.oxygen}%${state.hidden ? '・陰影中' : ''}`;
    document.querySelector<HTMLElement>('#oxygen-bar > i')!.style.width = `${state.oxygen}%`;
    const bossLabel = document.getElementById('boss-label')!;
    bossLabel.textContent = state.bossHp < state.bossMaxHp || state.phase.includes('算力') || state.phase.includes('05:00') ? `鼠怪 HP ${state.bossHp} / ${state.bossMaxHp}` : '';
    const devicePrompts = PROMPTS[state.device];
    const dynamicPrompt = state.prompt || devicePrompts.move;
    this.prompt.textContent = dynamicPrompt;
    this.updateTouchControls();
    if (state.device !== this.lastDevice) {
      this.lastDevice = state.device;
      this.prompt.style.borderColor = state.device === 'GAMEPAD' ? '#80d69a' : state.device === 'TOUCH' ? '#73c8dc' : '#e0b45e';
    }
    this.setGamepadStatus({ connected: snapshot.connected, name: snapshot.gamepadName });
  }
}
