// 各路径段独立编码，保留目录分隔符，路径相对于本模块定位。
const asset = (...segments) => new URL(
  `../../${segments.map(encodeURIComponent).join("/")}`,
  import.meta.url
).href;

const image = (file, width, height, alt, position = "center") => ({
  src: asset("photo", file), width, height, alt, position
});

export const slides = [
  image("1.jpg", 912, 563, "金色烈焰中的萧炎", "42% 43%"),
  image("5.jpg", 700, 290, "身着黑衣的萧炎展开火色双翼", "54% 45%"),
  image("6.jpg", 1206, 505, "萧炎侧身凝视，周围涌动青色异火", "38% 42%"),
  image("7.jpg", 739, 415, "金色光芒汇聚于白发武者掌间", "52% 40%")
];

export const journey = [
  {
    title: "乌坦城少年",
    stage: "斗之气三段",
    art: image("8.jpeg", 675, 1200, "乌坦城少年萧炎的肖像", "50% 25%"),
    text: "天赋跌落，少年在质疑中守住了自己的骄傲。斗之气三段，是低谷，也是重新出发的起点。"
  },
  {
    title: "药老引路",
    stage: "师徒初识",
    art: image("2.jpg", 700, 423, "披着斗篷踏上修炼之路的萧炎", "50% 24%"),
    text: "药老现身，悉心指点萧炎修炼与炼药。师徒同行，焚诀与异火成为这条修炼之路的重要篇章。"
  },
  {
    title: "三年之约",
    stage: "赴约与历练",
    art: image("3.jpg", 753, 554, "火色背景中摆开架势的萧炎", "58% 26%"),
    text: "萧炎如期赴三年之约，为昔日的承诺交出自己的答案。此后不断历练，与一路结识的伙伴并肩前行。"
  },
  {
    title: "炎帝归位",
    stage: "从斗圣到斗帝",
    art: image("4.jpg", 1000, 1314, "斗破苍穹萧炎纪念海报", "50% 26%"),
    text: "从斗圣之境再向前一步，萧炎最终踏入斗帝之境。曾经从乌坦城出发的少年，终以炎帝之名立于斗气大陆。"
  }
];

export const tribute = {
  src: asset("video", "1.mp4"),
  type: "video/mp4",
  poster: slides[1].src
};
