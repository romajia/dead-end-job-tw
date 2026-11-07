const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uNight;
uniform float uSunrise;
varying vec2 outTexCoord;

void main(void) {
  vec2 uv = outTexCoord;
  vec4 base = texture2D(uMainSampler, uv);
  float scan = sin((uv.y * 720.0 + uTime * 26.0) * 0.055) * 0.004 * uNight;
  vec2 offset = vec2(0.0035 + scan, 0.0) * uNight;
  float red = texture2D(uMainSampler, uv + offset).r;
  float blue = texture2D(uMainSampler, uv - offset).b;
  vec3 radar = vec3(red, base.g * (1.0 - 0.12 * uNight), blue);
  float vignette = smoothstep(0.94, 0.18, distance(uv, vec2(0.5)));
  radar *= mix(1.0, 0.68 + vignette * 0.32, uNight);
  float ray = pow(max(0.0, sin((uv.x * 9.0 + uv.y * 5.0 - uTime * 0.08) * 3.14159)), 8.0);
  vec3 dawn = vec3(1.0, 0.68, 0.28) * ray * 0.32 * uSunrise;
  gl_FragColor = vec4(mix(base.rgb, radar, uNight) + dawn, base.a);
}`;

const effectState = { night: 0, sunrise: 0 };

class MarketPostFXPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'MarketPostFX', renderTarget: true, fragShader: FRAGMENT_SHADER });
  }

  onPreRender(): void {
    this.set1f('uTime', this.game.loop.now * 0.001);
    this.set1f('uNight', effectState.night);
    this.set1f('uSunrise', effectState.sunrise);
  }
}

export function installPostFX(game: Phaser.Game): { setNight: (amount: number) => void; setSunrise: (amount: number) => void } {
  try {
    if (game.renderer.type !== Phaser.WEBGL) return { setNight: () => undefined, setSunrise: () => undefined };
    const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    renderer.pipelines.addPostPipeline('MarketPostFX', MarketPostFXPipeline);
    return {
      setNight: (amount) => { effectState.night = Math.max(0, Math.min(1, amount)); },
      setSunrise: (amount) => { effectState.sunrise = Math.max(0, Math.min(1, amount)); },
    };
  } catch {
    return { setNight: () => undefined, setSunrise: () => undefined };
  }
}
