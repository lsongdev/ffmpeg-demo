const wasmURL = new URL('./ffmpeg/core/ffmpeg-core.wasm', import.meta.url);
const coreURL = new URL('./ffmpeg/core/ffmpeg-core.js', import.meta.url);
const timeout = 60_000;

export async function loadEngine(ffmpeg, controller, onDownload, onInitialize) {
  const { signal } = controller;
  let timer;
  let blobURL;
  const startTimer = (message) => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(new Error(message)), timeout);
  };
  const downloadTimeout = '下载 FFmpeg 超时，已超过 60 秒未收到数据。';

  try {
    startTimer(downloadTimeout);
    const response = await fetch(wasmURL, { signal });
    if (!response.ok) throw new Error(`下载 FFmpeg 失败（HTTP ${response.status}）。`);

    const encoding = response.headers.get('Content-Encoding');
    const length = Number(response.headers.get('Content-Length'));
    const total = (!encoding || encoding === 'identity') && length > 0 ? length : 0;
    const reader = response.body?.getReader();
    const chunks = [];
    let received = 0;
    onDownload(received, total);

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          startTimer(downloadTimeout);
          chunks.push(value);
          received += value.byteLength;
          onDownload(received, received <= total ? total : 0);
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      const buffer = await response.arrayBuffer();
      chunks.push(buffer);
      received = buffer.byteLength;
    }
    if (!received || (total && received !== total)) {
      throw new Error('FFmpeg 下载不完整。');
    }

    onInitialize();
    startTimer('FFmpeg 初始化超时。');
    blobURL = URL.createObjectURL(new Blob(chunks, { type: 'application/wasm' }));
    chunks.length = 0;
    await ffmpeg.load({ coreURL: coreURL.href, wasmURL: blobURL }, { signal });
  } catch (error) {
    ffmpeg.terminate();
    throw signal.aborted ? signal.reason : error;
  } finally {
    clearTimeout(timer);
    if (blobURL) URL.revokeObjectURL(blobURL);
  }
}
