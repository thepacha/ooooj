import React from "react";
import mixpanel from "mixpanel-browser";

export enum MPSessionReplayMask {
  Text = "text",
  Web = "web",
  Map = "map",
  Image = "image",
}

export class MPSessionReplayConfig {
  wifiOnly?: boolean;
  recordingSessionsPercent?: number;
  autoStartRecording?: boolean;
  autoMaskedViews?: MPSessionReplayMask[];
  flushInterval?: number;
  enableLogging?: boolean;

  constructor(config: Partial<MPSessionReplayConfig> = {}) {
    this.wifiOnly = config.wifiOnly ?? true;
    this.recordingSessionsPercent = config.recordingSessionsPercent ?? 100;
    this.autoStartRecording = config.autoStartRecording ?? true;
    this.autoMaskedViews = config.autoMaskedViews ?? [MPSessionReplayMask.Text, MPSessionReplayMask.Image, MPSessionReplayMask.Web, MPSessionReplayMask.Map];
    this.flushInterval = config.flushInterval ?? 10;
    this.enableLogging = config.enableLogging ?? false;
  }
}

class MPSessionReplaySDK {
  private config: MPSessionReplayConfig | null = null;
  private recording = false;

  async initialize(token: string, distinctId: string, config: MPSessionReplayConfig): Promise<void> {
    this.config = config;
    
    try {
      // In mixpanel-browser, calling init multiple times with the same token 
      // can cause mutex/locking issues. We use set_config for updates if possible.
      // The SDK usually handles multiple init calls for the same token by returning 
      // the existing instance, but we want to be extra safe.
      
      mixpanel.init(token, {
        debug: config.enableLogging,
        record_sessions_percent: config.recordingSessionsPercent,
        record_mask_all_text: config.autoMaskedViews?.includes(MPSessionReplayMask.Text),
        record_mask_all_inputs: config.autoMaskedViews?.includes(MPSessionReplayMask.Text),
      });
      
      mixpanel.set_config({
        record_sessions_percent: config.recordingSessionsPercent,
        record_mask_all_text: config.autoMaskedViews?.includes(MPSessionReplayMask.Text),
        record_mask_all_inputs: config.autoMaskedViews?.includes(MPSessionReplayMask.Text),
      });
      
      mixpanel.identify(distinctId);
    } catch (err) {
      console.warn("MPSessionReplay initialization guard triggered", err);
    }
    
    if (config.autoStartRecording) {
      await this.startRecording();
    }
  }

  async startRecording(): Promise<void> {
    if ((mixpanel as any).start_session_recording) {
      (mixpanel as any).start_session_recording();
    }
    this.recording = true;
  }

  async stopRecording(): Promise<void> {
    if ((mixpanel as any).stop_session_recording) {
      (mixpanel as any).stop_session_recording();
    }
    this.recording = false;
  }

  async isRecording(): Promise<boolean> {
    return this.recording;
  }

  async identify(distinctId: string): Promise<void> {
    mixpanel.identify(distinctId);
  }
}

export const MPSessionReplay = new MPSessionReplaySDK();

export const MPSessionReplayView: React.FC<{ sensitive?: boolean, children: React.ReactNode, style?: React.CSSProperties, className?: string }> = ({ 
  sensitive = true, 
  children,
  style,
  className = ""
}) => {
  // Use Mixpanel browser's built-in block classes: 'mp-mask' for masking, 'mp-unmask' to explicitly unmask.
  // Although Mixpanel for web supports custom selectors via record_mask_input_selector, .mp-mask is always masked unless specified otherwise.
  // Web uses 'mp-mask' to mask when otherwise unmasked, but since record_mask_all_text is usually true, we might need 'mp-unmask' to exclude.
  const blockClass = sensitive ? 'mp-mask' : 'mp-unmask';
  
  return (
    <div className={`${blockClass} ${className}`} style={style}>
      {children}
    </div>
  );
};
