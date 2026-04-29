import { ready } from 'https://lsong.org/scripts/dom.js';
import { h, render, useState, useEffect, useRef } from 'https://lsong.org/scripts/react/index.js';
import { FFmpeg } from './ffmpeg/index.js';
import { fetchFile, toBlobURL } from './ffmpeg/util/index.js';

const baseURL = './ffmpeg/core';

const ffmpeg = new FFmpeg();

setTimeout(async () => {
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
});

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

const getFileExt = (name) => '.' + name.split('.').pop();

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
  // const [loaded, setLoaded] = useState(false);
  // const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [inputFile, setInputFile] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputInfo, setOutputInfo] = useState(null);
  const [preset, setPreset] = useState(presets[presets.length - 1]);
  const [globalOpts, setGlobalOpts] = useState('-loglevel info');
  const [inputOpts, setInputOpts] = useState('');
  const [outputOpts, setOutputOpts] = useState('');
  const [outputExt, setOutputExt] = useState('mp4');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const [screenshots, setScreenshots] = useState([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        ffmpeg.on('log', ({ message }) => setLogs((p) => [...p.slice(-99), message]));
        ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));
      } catch (e) {
        setError(e.message);
      }
      // setLoading(false);
    })();
  }, []);

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const generateThumbnails = async (file, ff) => {
    if (!file || !ff || !file.type.startsWith('video/')) return;

    setLoadingThumbs(true);
    setScreenshots([]);

    const inputName = 'thumb_input' + getFileExt(file.name);
    const count = 12;

    try {
      const duration = await getVideoDuration(file);
      if (!duration || duration < 1) {
        setLoadingThumbs(false);
        return;
      }

      const interval = duration / count;
      const timestamps = Array.from({ length: count }, (_, i) => +(interval * (i + 0.5)).toFixed(1));

      await ff.writeFile(inputName, await fetchFile(file));

      const thumbs = [];
      for (const t of timestamps) {
        try {
          if (t >= duration) break;
          await ff.exec(['-ss', t.toString(), '-i', inputName, '-vframes', '1', `thumb_${t}.jpg`]);
          const data = await ff.readFile(`thumb_${t}.jpg`);
          if (data && data.length > 0) {
            const blob = new Blob([data.buffer], { type: 'image/jpeg' });
            thumbs.push({ t, url: URL.createObjectURL(blob) });
          }
          await ff.deleteFile(`thumb_${t}.jpg`);
        } catch (e) { }
      }

      await ff.deleteFile(inputName);
      setScreenshots(thumbs);
    } catch (e) {
      console.error('Thumbnail generation failed', e);
    }
    setLoadingThumbs(false);
  };

  const applyPreset = (p) => {
    setPreset(p);
    setGlobalOpts(p.global);
    setInputOpts(p.input);
    setOutputOpts(p.output);
    setOutputExt(p.ext);
    setOutputUrl(null);
    setOutputInfo(null);
    setProgress(0);
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
    if (!inputFile || !ffmpeg) return;
    setRunning(true);
    setProgress(0);
    setOutputUrl(null);
    setOutputInfo(null);
    setError(null);
    setLogs([]);

    const inName = 'input' + getFileExt(inputFile.name);
    const outName = 'output.' + outputExt;

    try {
      await ffmpeg.writeFile(inName, await fetchFile(inputFile));

      const cmd = [
        ...parseArgs(globalOpts),
        ...parseArgs(inputOpts),
        '-i', inName,
        ...parseArgs(outputOpts),
        outName,
      ];

      await ffmpeg.exec(cmd);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: getMimeType(outputExt) });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setOutputInfo({ name: outName, size: blob.size, url });

      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
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
      // loading && h('div', { className: 'loading' }, 'loading ffmpeg core...'),
      error && h('div', { className: 'error' }, error),

      h('div', null,
        h('h1', null, 'ffmpeg'),

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
            ref: inputRef,
            type: 'file',
            onChange: (e) => {
              setInputFile(e.target.files[0]);
              setOutputUrl(null);
              setOutputInfo(null);
              if (e.target.files[0]) {
                generateThumbnails(e.target.files[0], ffmpeg);
              }
            },
          }),
          inputFile && h('div', { className: 'file-info' },
            inputFile.name, ' ', formatFileSize(inputFile.size)
          ),

          // Thumbnails
          loadingThumbs && h('div', { className: 'thumb-strip loading' }, 'Generating thumbnails...'),
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

        // run button
        h('button', {
          className: 'run-btn',
          onClick: run,
          disabled: !inputFile || running,
        }, running ? 'running...' : 'run'),

        // progress
        progress > 0 && h('div', { className: 'progress' },
          progress + '%',
          h('div', { className: 'bar' },
            h('div', { style: { width: progress + '%' } })
          )
        ),

        // output
        outputInfo && h('section', null,
          h('label', null, 'output'),
          h('div', { className: 'output-info' },
            h('span', null, outputInfo.name),
            h('span', null, formatFileSize(outputInfo.size)),
            h('a', { href: outputInfo.url, download: outputInfo.name, className: 'btn' }, 'download')
          ),
          outputExt.match(/mp4|webm|mov/) && h('video', { src: outputInfo.url, controls: true, style: { width: '100%' } }),
          outputExt.match(/mp3|wav|ogg|aac|flac/) && h('audio', { src: outputInfo.url, controls: true, style: { width: '100%' } }),
          outputExt.match(/jpg|jpeg|png/) && h('img', { src: outputInfo.url, style: { width: '100%' } })
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