export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface VoicePipelineConfig {
  sampleRate: number;
  vadSensitivity: number;
  sttProvider: 'whisper-local' | 'cloud-stt';
  ttsProvider: 'piper-local' | 'cloud-tts';
}

export class VoicePipelineEngine {
  private state: VoiceState = 'idle';

  getState(): VoiceState {
    return this.state;
  }

  async processAudioTurn(audioBuffer: Buffer, onTTSSample?: (sample: Buffer) => void): Promise<string> {
    if (!audioBuffer) throw new Error('Invalid audio buffer');
    this.state = 'listening';
    // VAD -> STT -> Core -> TTS pipeline
    this.state = 'thinking';
    const transcript = 'Recognized user command from voice stream';
    this.state = 'speaking';

    if (onTTSSample) {
      onTTSSample(Buffer.from('mock-pcm-audio'));
    }

    this.state = 'idle';
    return transcript;
  }
}
