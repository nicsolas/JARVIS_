export interface STTResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export interface ISpeechToText {
  readonly providerId: string;
  startListening(onResult: (result: STTResult) => void): Promise<void>;
  stopListening(): Promise<void>;
}

export interface ITextToSpeech {
  readonly providerId: string;
  synthesize(text: string): Promise<ArrayBuffer>;
}

export interface IVoicePipeline {
  readonly stt: ISpeechToText;
  readonly tts: ITextToSpeech;
  isListening: boolean;
  isSpeaking: boolean;
}
