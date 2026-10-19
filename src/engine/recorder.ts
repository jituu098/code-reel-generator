export class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor(private canvas: HTMLCanvasElement) {}

  public start() {
    this.recordedChunks = [];
    const stream = this.canvas.captureStream(60); // 60 FPS

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps for crisp text
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }
  public stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject("Recorder not initialized");
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      this.mediaRecorder.stop();
    });
  }
}