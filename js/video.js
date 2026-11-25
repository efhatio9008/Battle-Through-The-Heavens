import { tribute } from "./data/media.js";
import { pauseBackgroundMusicForVideo, resumeBackgroundMusicAfterVideo } from "./background-music.js";

export function mount(root, signal) {
  const video = root.querySelector("video");
  const message = root.querySelector("[data-video-error]");
  const showError = () => {
    resumeBackgroundMusicAfterVideo();
    const errors = {
      2: "视频读取中断。请检查连接并刷新页面重试。",
      3: "浏览器无法解码该视频。请尝试使用其他浏览器或下载原文件。",
      4: "视频文件无法读取，或当前浏览器不支持其编码。"
    };
    const link = document.createElement("a");
    link.href = tribute.src;
    link.download = "";
    link.textContent = "下载原视频";
    message.replaceChildren(
      document.createTextNode(errors[video.error?.code] ?? "当前浏览器无法加载此视频。"),
      link
    );
    message.hidden = false;
  };

  video.poster = tribute.poster;
  video.addEventListener("play", pauseBackgroundMusicForVideo, { signal });
  video.addEventListener("pause", resumeBackgroundMusicAfterVideo, { signal });
  video.addEventListener("ended", resumeBackgroundMusicAfterVideo, { signal });
  video.addEventListener("error", showError, { signal });
  video.addEventListener("loadedmetadata", () => { message.hidden = true; }, { signal });
  if (video.canPlayType(tribute.type)) video.src = tribute.src;
  else showError();

  signal.addEventListener("abort", () => {
    // Leaving Video must stop playback, including while the video is buffering.
    video.pause();
    resumeBackgroundMusicAfterVideo();
    video.removeAttribute("src");
    video.load();
  }, { once: true });
}
