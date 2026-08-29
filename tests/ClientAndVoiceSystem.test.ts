import { describe, it, expect } from 'vitest';
import { AppControlTool, FileReadTool } from '../src/tools/execution/RealSystemTools.js';
import { TauriDesktopEngine } from '../src/clients/desktop/TauriDesktopEngine.ts';
import { ReactNativeMobileEngine } from '../src/clients/mobile/ReactNativeMobileEngine.js';
import { VoicePipelineEngine } from '../src/voice/pipeline/VoicePipelineEngine.js';
import { CallingEngine } from '../src/calling/engine/CallingEngine.js';
import { JarvisUIController } from '../src/ui/JarvisUIController.js';

describe('M9-M14 Client, Voice, Tools & Visual UI Suite', () => {
  it('should execute real app launch and file system tools safely', async () => {
    const appTool = new AppControlTool();
    const res = await appTool.execute({ appName: 'spotify' }, {});
    expect(res.success).toBe(true);

    const fileTool = new FileReadTool();
    const fileRes = await fileTool.execute({ filepath: '/tmp/test.txt' }, {});
    expect(fileRes.content).toContain('/tmp/test.txt');
  });

  it('should initialize desktop & mobile client engines', async () => {
    const desktop = new TauriDesktopEngine();
    expect(desktop.getConfig().globalHotkey).toContain('Alt+J');

    const mobile = new ReactNativeMobileEngine();
    const token = await mobile.registerPushToken();
    expect(token).toBeDefined();
  });

  it('should manage voice turn pipeline and WebRTC calling state', async () => {
    const voice = new VoicePipelineEngine();
    const transcript = await voice.processAudioTurn(Buffer.from('pcm'));
    expect(transcript).toBeDefined();

    const calling = new CallingEngine();
    const call = calling.startCall('user_device_01');
    expect(call.state).toBe('ringing');
    calling.acceptCall(call.id);
    expect(call.state).toBe('connected');
  });

  it('should reflect UI visual core state transitions in dark theme', () => {
    const ui = new JarvisUIController();
    expect(ui.getState().visualState).toBe('idle');
    ui.setVisualState('thinking', 'Processing intelligence graph');
    expect(ui.getState().visualState).toBe('thinking');
    expect(ui.getState().theme.background).toBe('#0A0A0C');
  });
});
