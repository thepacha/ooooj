export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private onDataCallback: ((data: Blob) => void) | null = null;

  async start(onData: (data: Blob) => void) {
    try {
      this.onDataCallback = onData;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // We don't need to specify mimeType, Deepgram auto-detects standard browser formats (webm/mp4)
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && this.onDataCallback) {
          this.onDataCallback(e.data);
        }
      };

      // Send chunks every 250ms for low latency streaming
      this.mediaRecorder.start(250);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw err;
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.onDataCallback = null;
  }
}
