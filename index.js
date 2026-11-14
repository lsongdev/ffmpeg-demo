import { ready } from 'https://lsong.org/scripts/dom/index.js';
import { h, render, useState, useEffect, useRef } from 'https://lsong.org/scripts/react/index.js';
import { FFmpeg } from './ffmpeg/index.js';
import { fetchFile } from './ffmpeg/util/index.js';
import { loadEngine } from './engine.js';

const ffmpeg = new FFmpeg();

const presets = [
  {
    id: 'extract-audio',
    label: '提取音频',
    global: '-loglevel warning',
    input: '',
    output: '-vn -acodec libmp3lame -q:a 2',
    ext: 'mp3',
  },
  {
    id: 'transcode-video',
    label: '视频转码',
    global: '-loglevel warning',
    input: '',
    output: '-c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k',
    ext: 'mp4',
  },
  {
    id: 'trim-video',
    label: '视频截取',
    global: '-loglevel warning',
    input: '-ss 00:00:00',
    output: '-t 00:00:10 -c copy',
    ext: 'mp4',
  },
  {
    id: 'compress-audio',
    label: '音频压缩',
    global: '-loglevel warning',
    input: '',
    output: '-acodec libmp3lame -ab 128k',
    ext: 'mp3',
  },
  {
    id: 'audio-convert',
    label: '音频转换',
    global: '-loglevel warning',
    input: '',
    output: '-q:a 2',
    ext: 'mp3',
  },
  {
    id: 'mute-video',
    label: '视频静音',
    global: '-loglevel warning',
    input: '',
    output: '-an -c:v copy',
    ext: 'mp4',
  },
  {
    id: 'volume-adjust',
    label: '音量调节',
    global: '-loglevel warning',
    input: '',
    output: '-af "volume=1.5"',
    ext: 'mp4',
  },
  {
    id: 'rotate-90',
    label: '旋转90度',
    global: '-loglevel warning',
    input: '',
    output: '-vf "transpose=1"',
    ext: 'mp4',
  },
  {
    id: 'flip-h',
    label: '水平翻转',
    global: '-loglevel warning',
    input: '',
    output: '-vf "hflip"',
    ext: 'mp4',
  },
  {
    id: 'flip-v',
    label: '垂直翻转',
    global: '-loglevel warning',
    input: '',
    output: '-vf "vflip"',
    ext: 'mp4',
  },
  {
    id: 'speed-2x',
    label: '倍速2x',
    global: '-loglevel warning',
    input: '',
    output: '-vf "setpts=0.5*PTS" -af "atempo=2.0"',
    ext: 'mp4',
  },
  {
    id: 'speed-0.5x',
    label: '慢放0.5x',
    global: '-loglevel warning',
    input: '',
    output: '-vf "setpts=2.0*PTS" -af "atempo=0.5"',
    ext: 'mp4',
  },
  {
    id: 'thumbnail',
    label: '提取封面',
    global: '-loglevel warning',
    input: '-ss 00:00:05',
    output: '-frames:v 1 -q:v 2',
    ext: 'jpg',
  },
  {
    id: 'gif-optimize',
    label: 'GIF 优化',
    global: '-loglevel warning',
    input: '',
    output: '-vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"',
    ext: 'gif',
  },
  {
    id: 'custom',
    label: '自定义',
    global: '-loglevel info',
    input: '',
    output: '',
    ext: 'mp4',
  },
];

const quickGlobal = [
  { label: 'quiet', value: '-loglevel quiet' },
  { label: 'warning', value: '-loglevel warning' },
  { label: 'info', value: '-loglevel info' },
  { label: 'verbose', value: '-loglevel verbose' },
  { label: '-y', value: '-y' },
  { label: '-n', value: '-n' },
];

const quickInput = [
  { label: 'seek', value: '-ss 00:00:00' },
  { label: 'duration', value: '-t 00:00:10' },
  { label: 'stop', value: '-to 00:00:10' },
  { label: 'no-video', value: '-vn' },
  { label: 'no-audio', value: '-an' },
  { label: 'fps 30', value: '-r 30' },
  { label: '1080p', value: '-s 1920x1080' },
  { label: '720p', value: '-s 1280x720' },
];

const quickOutput = [
  { label: 'h264', value: '-c:v libx264' },
  { label: 'h265', value: '-c:v libx265' },
  { label: 'vp9', value: '-c:v vp9' },
  { label: 'copy', value: '-c copy' },
  { label: 'aac', value: '-c:a aac' },
  { label: 'mp3', value: '-acodec libmp3lame' },
  { label: 'opus', value: '-c:a libopus' },
  { label: 'crf 18', value: '-crf 18' },
  { label: 'crf 23', value: '-crf 23' },
  { label: 'fast', value: '-preset ultrafast' },
  { label: 'medium', value: '-preset medium' },
  { label: 'slow', value: '-preset slow' },
  { label: '128k', value: '-b:a 128k' },
  { label: '192k', value: '-b:a 192k' },
  { label: '320k', value: '-b:a 320k' },
  { label: 'no-video', value: '-vn' },
  { label: 'no-audio', value: '-an' },
  { label: 'scale 1080p', value: '-vf scale=1920:1080' },
  { label: 'scale 720p', value: '-vf scale=1280:720' },
  { label: 'fps 30', value: '-r 30' },
  { label: 'fps 60', value: '-r 60' },
  { label: '静音', value: '-an' },
  { label: '音量2x', value: '-af "volume=2.0"' },
  { label: '音量减半', value: '-af "volume=0.5"' },
  { label: '顺时针90', value: '-vf "transpose=1"' },
  { label: '逆时针90', value: '-vf "transpose=2"' },
  { label: '水平翻转', value: '-vf "hflip"' },
  { label: '垂直翻转', value: '-vf "vflip"' },
  { label: '倍速2x', value: '-vf "setpts=0.5*PTS" -af "atempo=2.0"' },
  { label: '慢放0.5x', value: '-vf "setpts=2.0*PTS" -af "atempo=0.5"' },
  { label: 'GIF优化', value: '-vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"' },
];

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getMimeType = (ext) => {
  const types = {
    mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo',
    mov: 'video/quicktime', mkv: 'video/x-matroska', gif: 'image/gif',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    aac: 'audio/aac', flac: 'audio/flac',
    jpg: 'image/jpeg', png: 'image/png',
  };
  return types[ext] || 'application/octet-stream';
};

const getFileExt = (name) => name.match(/\.[a-z0-9]+$/i)?.[0] || '';
const describeError = (error) => error?.message || String(error);

const waitForVideo = (video, event, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => finish(new Error('视频预览读取超时。')), 8_000);
  const ready = () => finish();
  const failed = () => finish(new Error('浏览器无法读取此视频。'));
  const aborted = () => finish(signal.reason);
  function finish(error) {
    clearTimeout(timer);
    video.removeEventListener(event, ready);
    video.removeEventListener('error', failed);
    signal.removeEventListener('abort', aborted);
    if (error) reject(error);
    else resolve();
  }
  video.addEventListener(event, ready);
  video.addEventListener('error', failed);
  signal.addEventListener('abort', aborted);
});

const generateThumbnails = async (file, signal) => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 120;
  const context = canvas.getContext('2d');
  const url = URL.createObjectURL(file);

  try {
    video.preload = 'auto';
    const metadata = waitForVideo(video, 'loadedmetadata', signal);
    video.src = url;
    await metadata;
    const { duration, videoWidth, videoHeight } = video;
    if (!Number.isFinite(duration) || duration < 1 || !videoWidth || !videoHeight) return [];

    const scale = Math.max(canvas.width / videoWidth, canvas.height / videoHeight);
    const width = videoWidth * scale;
    const height = videoHeight * scale;
    const thumbs = [];
    for (let i = 0; i < 12; i++) {
      signal.throwIfAborted();
      const t = duration * (i + 0.5) / 12;
      const frame = waitForVideo(video, 'seeked', signal);
      video.currentTime = t;
      await frame;
      context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      thumbs.push({ t: Number(t.toFixed(1)), url: canvas.toDataURL('image/jpeg') });
    }
    return thumbs;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
};

const toggleOpt = (current, value) => {
  const key = value.split(' ')[0];
  const exists = current.includes(key);
  if (exists) {
    return current
      .split(' ')
      .filter((_, i, arr) => {
        if (arr[i] === key) return false;
        if (i > 0 && arr[i - 1] === key) return false;
        return true;
      })
      .join(' ')
      .trim();
  }
  return current ? current + ' ' + value : value;
};

const App = () => {
  const [engine, setEngine] = useState({ phase: 'downloading', received: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [inputFile, setInputFile] = useState(null);
  const [outputInfo, setOutputInfo] = useState(null);
  const [preset, setPreset] = useState(presets[presets.length - 1]);
  const [globalOpts, setGlobalOpts] = useState('-loglevel info');
  const [inputOpts, setInputOpts] = useState('');
  const [outputOpts, setOutputOpts] = useState('');
  const [outputExt, setOutputExt] = useState('mp4');
  const [progress, setProgress] = useState(null);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);
  const loadRef = useRef(null);
  const runningRef = useRef(false);
  const running = Boolean(stage);

  const [screenshots, setScreenshots] = useState([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [thumbError, setThumbError] = useState(null);

  const initialize = async () => {
    if (loadRef.current) return;
    const controller = new AbortController();
    loadRef.current = controller;
    setEngine({ phase: 'downloading', received: 0, total: 0 });
    try {
      await loadEngine(ffmpeg, controller,
        (received, total) => setEngine({ phase: 'downloading', received, total }),
        () => setEngine({ phase: 'initializing' }));
      setEngine({ phase: 'ready' });
    } catch (error) {
      setEngine({ phase: 'failed', message: describeError(error) });
    } finally {
      loadRef.current = null;
    }
  };

  useEffect(() => {
    const log = ({ message }) => setLogs((entries) => [...entries.slice(-99), message]);
    const reportProgress = ({ progress }) => {
      if (Number.isFinite(progress) && progress >= 0) {
        setProgress(Math.min(99, Math.round(progress * 100)));
      }
    };
    ffmpeg.on('log', log);
    ffmpeg.on('progress', reportProgress);
    initialize();
    return () => {
      loadRef.current?.abort();
      ffmpeg.off('log', log);
      ffmpeg.off('progress', reportProgress);
      ffmpeg.terminate();
    };
  }, []);

  useEffect(() => {
    if (!inputFile?.type.startsWith('video/')) return;
    const controller = new AbortController();
    setLoadingThumbs(true);
    generateThumbnails(inputFile, controller.signal)
      .then((thumbs) => {
        if (!controller.signal.aborted) setScreenshots(thumbs);
      })
      .catch(() => {
        if (!controller.signal.aborted) setThumbError('无法生成视频缩略图，仍可尝试转换。');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingThumbs(false);
      });
    return () => controller.abort();
  }, [inputFile]);

  useEffect(() => () => {
    if (outputInfo) URL.revokeObjectURL(outputInfo.url);
  }, [outputInfo]);

  const applyPreset = (p) => {
    setPreset(p);
    setGlobalOpts(p.global);
    setInputOpts(p.input);
    setOutputOpts(p.output);
    setOutputExt(p.ext);
    setOutputInfo(null);
    setProgress(null);
    setError(null);
  };

  const parseArgs = (str) => {
    const args = [];
    let current = '';
    let inQuote = false;
    for (const ch of str) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ' ' && !inQuote) {
        if (current) args.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current) args.push(current);
    return args;
  };

  const run = async () => {
    if (!inputFile || engine.phase !== 'ready' || runningRef.current) return;
    if (!ffmpeg.loaded) {
      setEngine({ phase: 'failed', message: '转换引擎已停止，请重新加载。' });
      return;
    }

    const ext = outputExt.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(ext)) {
      setError('请输入有效的输出格式，例如 mp3 或 mp4。');
      return;
    }
    if (!inputFile.size) {
      setError('所选文件为空，请选择其他文件。');
      return;
    }

    runningRef.current = true;
    setStage('正在读取文件…');
    setProgress(null);
    setOutputInfo(null);
    setError(null);
    setLogs([]);

    const inName = 'input' + getFileExt(inputFile.name);
    const outName = 'output.' + ext;
    let failureMessage = '读取输入文件失败';
    let inputWritten = false;
    let conversionStarted = false;
    try {
      await ffmpeg.writeFile(inName, await fetchFile(inputFile));
      inputWritten = true;

      const cmd = [
        ...parseArgs(globalOpts),
        ...parseArgs(inputOpts),
        '-i', inName,
        ...parseArgs(outputOpts),
        outName,
      ];

      setStage('正在转换…');
      failureMessage = '转换失败，请检查文件是否包含所需的音频或视频轨道，或查看下方日志';
      conversionStarted = true;
      const exitCode = await ffmpeg.exec(cmd);
      if (exitCode !== 0) throw new Error(`FFmpeg 退出码 ${exitCode}`);

      setStage('正在读取转换结果…');
      failureMessage = '读取转换结果失败';
      const data = await ffmpeg.readFile(outName);
      if (!data.byteLength) throw new Error('输出文件为空');
      const blob = new Blob([data], { type: getMimeType(ext) });
      const url = URL.createObjectURL(blob);
      setOutputInfo({ name: outName, size: blob.size, url, ext });
    } catch (error) {
      setError(`${failureMessage}（${describeError(error)}）。`);
      if (!ffmpeg.loaded) {
        setEngine({ phase: 'failed', message: '转换引擎已停止，请重新加载。' });
      }
    } finally {
      const cleanup = [];
      if (inputWritten) cleanup.push(ffmpeg.deleteFile(inName));
      if (conversionStarted) cleanup.push(ffmpeg.deleteFile(outName));
      await Promise.allSettled(cleanup);
      runningRef.current = false;
      setStage('');
      setProgress(null);
    }
  };

  const commandPreview = [
    'ffmpeg',
    globalOpts,
    inputOpts,
    '-i', inputFile ? 'input' + getFileExt(inputFile.name) : '<file>',
    outputOpts,
    'output.' + outputExt,
  ].filter(Boolean).join(' ');

  return [
    h('div', { className: 'app' },
      h('div', null,
        h('h1', null, 'ffmpeg'),
        h('div', { className: 'engine-status', role: 'status' },
          engine.phase === 'downloading' && [
            h('div', null, `正在下载 FFmpeg… ${formatFileSize(engine.received)}${engine.total
              ? ` / ${formatFileSize(engine.total)}（${Math.floor(engine.received / engine.total * 100)}%）` : ''}`),
            h('progress', { 'aria-label': 'FFmpeg 下载进度', max: engine.total || 1, value: engine.total ? engine.received : undefined }),
          ],
          engine.phase === 'initializing' && '正在初始化 FFmpeg…',
          engine.phase === 'ready' && 'FFmpeg 已就绪',
        ),
        engine.phase === 'failed' && h('div', { className: 'engine-status error' },
          h('div', { role: 'alert' }, `无法加载转换引擎。 ${engine.message}`),
          h('button', { type: 'button', onClick: initialize }, '重新加载 FFmpeg'),
        ),

        h('fieldset', { className: 'conversion-options', disabled: running },
          // presets
          h('section', null,
            h('label', null, 'preset'),
            h('div', { className: 'presets' },
              ...presets.map((p) =>
                h('button', {
                  key: p.id,
                  className: preset.id === p.id ? 'active' : '',
                  onClick: () => applyPreset(p),
                }, p.label)
              )
            )
          ),

          // input file
          h('section', null,
            h('label', null, 'input'),
            h('input', {
              type: 'file',
              onChange: (e) => {
                setInputFile(e.target.files[0] || null);
                setOutputInfo(null);
                setError(null);
                setScreenshots([]);
                setLoadingThumbs(false);
                setThumbError(null);
              },
            }),
            inputFile && h('div', { className: 'file-info' },
              inputFile.name, ' ', formatFileSize(inputFile.size)
            ),

            // Thumbnails
            loadingThumbs && h('div', { className: 'thumb-strip loading' }, '正在生成缩略图…'),
            thumbError && h('div', { className: 'file-info', role: 'status' }, thumbError),
            !loadingThumbs && screenshots.length > 0 && h('div', { className: 'thumb-strip' },
              ...screenshots.map((thumb) =>
                h('div', { className: 'thumb-item' },
                  h('img', { src: thumb.url }),
                  h('span', null, thumb.t + 's')
                )
              )
            ),
          ),

          // global options
          h('section', null,
            h('label', null, 'global options'),
            h('input', {
              type: 'text',
              value: globalOpts,
              onChange: (e) => setGlobalOpts(e.target.value),
              placeholder: '-loglevel info -y',
            }),
            h('div', { className: 'quick-btns' },
              ...quickGlobal.map((q) =>
                h('button', {
                  key: q.value,
                  onClick: () => setGlobalOpts(toggleOpt(globalOpts, q.value)),
                }, q.label)
              )
            )
          ),

          // input options
          h('section', null,
            h('label', null, 'input options'),
            h('input', {
              type: 'text',
              value: inputOpts,
              onChange: (e) => setInputOpts(e.target.value),
              placeholder: '-ss 00:00:00 -t 00:00:10',
            }),
            h('div', { className: 'quick-btns' },
              ...quickInput.map((q) =>
                h('button', {
                  key: q.value,
                  onClick: () => setInputOpts(toggleOpt(inputOpts, q.value)),
                }, q.label)
              )
            )
          ),

          // output options
          h('section', null,
            h('label', null, 'output options'),
            h('input', {
              type: 'text',
              value: outputOpts,
              onChange: (e) => setOutputOpts(e.target.value),
              placeholder: '-c:v libx264 -crf 23',
            }),
            h('div', { className: 'quick-btns' },
              ...quickOutput.map((q) =>
                h('button', {
                  key: q.value,
                  onClick: () => setOutputOpts(toggleOpt(outputOpts, q.value)),
                }, q.label)
              )
            )
          ),

          // output extension
          h('section', null,
            h('label', null, 'output format'),
            h('input', {
              type: 'text',
              value: outputExt,
              onChange: (e) => setOutputExt(e.target.value),
              placeholder: 'mp4',
              style: { width: '80px' },
            }),
            h('div', { className: 'quick-btns' },
              ...['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif', 'mp3', 'wav', 'ogg', 'aac', 'flac', 'jpg', 'png'].map((ext) =>
                h('button', {
                  key: ext,
                  onClick: () => setOutputExt(ext),
                }, ext)
              )
            )
          ),

          // command preview
          h('section', null,
            h('label', null, 'command'),
            h('pre', { className: 'command' }, commandPreview)
          ),
        ),

        h('button', {
          type: 'button',
          className: 'run-btn',
          onClick: run,
          disabled: !inputFile || engine.phase !== 'ready' || running,
        }, running ? stage : '开始转换'),

        h('div', { className: 'conversion-status', role: 'status' },
          running && (progress === null ? stage : `${stage} ${progress}%`),
          !running && outputInfo && '转换完成',
          engine.phase === 'downloading' && 'FFmpeg 下载完成后即可转换。',
          engine.phase === 'initializing' && '正在等待 FFmpeg 初始化。',
          !running && !inputFile && engine.phase === 'ready' && '请选择要转换的文件。',
        ),
        running && h('progress', { 'aria-label': '转换进度', max: 100, value: progress ?? undefined }),
        error && h('div', { className: 'error', role: 'alert' }, error),

        // output
        outputInfo && h('section', null,
          h('label', null, 'output'),
          h('div', { className: 'output-info' },
            h('span', null, outputInfo.name),
            h('span', null, formatFileSize(outputInfo.size)),
            h('a', { href: outputInfo.url, download: outputInfo.name, className: 'btn' }, 'download')
          ),
          /^(mp4|webm|mov)$/.test(outputInfo.ext) && h('video', { src: outputInfo.url, controls: true, style: { width: '100%' } }),
          /^(mp3|wav|ogg|aac|flac)$/.test(outputInfo.ext) && h('audio', { src: outputInfo.url, controls: true, style: { width: '100%' } }),
          /^(jpg|jpeg|png)$/.test(outputInfo.ext) && h('img', { src: outputInfo.url, style: { width: '100%' } })
        ),

        // logs
        logs.length > 0 && h('section', null,
          h('label', null, 'logs'),
          h('pre', { className: 'logs' },
            logs.map((l, i) => h('div', { key: i }, l))
          )
        ),

        // footer
        h('footer', { className: 'footer' },
          'This application uses FFmpeg under the ',
          h('a', { href: 'https://www.ffmpeg.org/legal.html', target: '_blank' }, 'LGPL/GPL'),
          ' license. FFmpeg is a registered trademark of the ',
          h('a', { href: 'https://www.ffmpeg.org/', target: '_blank' }, 'FFmpeg project'),
          '.'
        )
      )
    )
  ];
};

ready(() => {
  render(h(App), document.getElementById('app'));
});
