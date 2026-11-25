const flame = (id, name, color, shape, duration, original = false) => ({
  id, name, color, shape, duration, original
});

const batches = [
  [
    flame("green-lotus", "青莲地心火", "#71ddb0", "lotus", 2.6),
    flame("fallen-heart", "陨落心炎", "#ff9f62", "spire", 1.8),
    flame("bone-chill", "骨灵冷火", "#a9d9ff", "shard", 3.1),
    flame("three-thousand", "三千焱炎火", "#ba9aff", "comet", 2.35),
    flame("purifying-lotus", "净莲妖火", "#ff9aae", "lotus", 3.4)
  ],
  [
    flame("sea-heart", "海心焰", "#5ab8ff", "wave", 2.8),
    flame("thunder-dragons", "九龙雷罡火", "#dceaff", "shard", 1.4),
    flame("turtle-earth", "龟灵地火", "#d59e64", "core", 3.7),
    flame("myriad-beasts", "万兽灵火", "#fa774c", "comet", 1.7),
    flame("life-spirit", "生灵之焱", "#b3ed78", "spire", 3.2)
  ],
  [
    flame("eight-desolations", "八荒破灭焱", "#9c87db", "wave", 2.1),
    flame("ancestral-gold", "九幽金祖火", "#ffcb68", "core", 2.45),
    flame("aurora", "红莲业火", "#f78db5", "comet", 2.9),
    flame("indigo-tide", "九幽风炎", "#778dff", "wave", 3.6),
    flame("amber-reed", "火云水炎", "#ffad52", "spire", 2.05)
  ],
  [
    flame("pine-echo", "火山石焰", "#43c9a5", "comet", 2.75),
    flame("moon-ice", "风怒龙炎", "#b0cfff", "shard", 4.1),
    flame("red-cloud", "幽冥毒火", "#ff656f", "lotus", 1.55),
    flame("silk-star", "阴阳双炎", "#e592ff", "shard", 2.2),
    flame("dusk-ember", "玄黄炎", "#e8a685", "core", 3.55)
  ],
  [
    flame("golden-emperor", "金帝焚天炎", "#ffdb7b", "spire", 1.9),
    flame("void-devourer", "虚无吞炎", "#9c76bc", "wave", 3.05)
  ]
];

const chapterNames = ["初炼异火", "双脉同燃", "焰阵初成", "百炼一心", "二十二火", "帝炎觉醒"];
const chapterResults = ["第一次融合成功。", "第二次融合成功。", "第三次融合成功。", "第四次融合成功。", "万火归宗。", "第 23 种帝炎诞生，炎帝归位！"];

export const flames = batches.flatMap((batch, step) => batch.map(item => ({ ...item, step })));

export const stages = chapterNames.map((name, step) => ({
  name,
  result: chapterResults[step],
  target: flames.filter(item => item.step <= step).length,
  final: step === batches.length
}));
