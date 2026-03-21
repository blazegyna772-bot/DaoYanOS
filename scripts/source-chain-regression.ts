import assert from "node:assert/strict"
import {
  buildEffectivePlotForGenerate,
  buildFaithfulHeader,
  buildFaithfulSuffix,
  buildStageBPrompt,
  determineNarrativeMode,
  type PromptBuilderOptions,
} from "../src/lib/promptBuilder"
import { normalizeBeatType, reinforceDialogueInSceneSummaries } from "../src/lib/chainEngine"
import type { AssetState, BridgeState, Director, Scene } from "../src/types"
import { getPromptConfig } from "../src/lib/promptLoader"

const director: Director = {
  id: "regression-director",
  name: "回归导演",
  nameEn: "Regression Director",
  style: "冷峻现实主义",
  techniques: ["静态构图", "缓推镜头"],
  lighting: "冷色逆光",
  films: [],
  color: "from-slate-500 to-slate-700",
  category: "narrative",
}

const assets: AssetState = {
  character: [
    {
      id: "char_1",
      type: "character",
      name: "万一山",
      desc: "男性，中年，深色长袍，目光沉稳。",
    },
  ],
  image: [
    {
      id: "img_1",
      type: "image",
      name: "洞口空地",
      desc: "夜晚，树林包围，月光昏暗。",
    },
  ],
  props: [
    {
      id: "prop_1",
      type: "props",
      name: "银针",
      desc: "细长金属针，银白色。",
    },
  ],
  assetNameMap: {
    万一山: "@人物1",
    洞口空地: "@图片1",
    银针: "@道具1",
  },
  assetTagEnabled: {
    character: true,
    image: true,
    props: true,
  },
}

const baseOptions: PromptBuilderOptions = {
  director,
  visualStyle: "cinematic",
  duration: 120,
  isSTCEnabled: true,
  isFaithfulMode: true,
  isScriptImported: true,
  assets,
  shotMode: "auto",
  enableBGM: false,
  enableSubtitle: true,
}

function main() {
  const plot = "万一山在洞口空地检查中毒者，决定入墓寻找解药。"
  const effectivePlot = buildEffectivePlotForGenerate(plot, true, true, assets)
  assert.match(effectivePlot, /万一山/)
  assert.match(effectivePlot, /@人物1/)
  assert.match(effectivePlot, /剧本角色→标签映射/)

  const faithfulSuffix = buildFaithfulSuffix(true, true, assets)
  assert.match(faithfulSuffix, /@标签/)
  assert.match(faithfulSuffix, /标签必须优先于任何外貌描写/)

  const noTagAssets: AssetState = {
    ...assets,
    assetTagEnabled: {
      character: false,
      image: false,
      props: false,
    },
  }
  const noTagSuffix = buildFaithfulSuffix(true, true, noTagAssets)
  assert.match(noTagSuffix, /禁止在提示词中出现任何@人物\/@图片\/@道具标签/)

  assert.equal(determineNarrativeMode(20), "burst")
  assert.equal(determineNarrativeMode(60), "mini")
  assert.equal(determineNarrativeMode(120), "full")
  assert.equal(normalizeBeatType("reaction", 2, 6), "debate")
  assert.equal(normalizeBeatType("decision", 3, 6), "act2in")
  assert.equal(normalizeBeatType("resolution", 5, 6), "finale")
  assert.equal(normalizeBeatType("unknown_custom", 4, 6), "act3in")

  const reinforcedScenes = reinforceDialogueInSceneSummaries(
    [
      {
        id: "scene_dialogue",
        name: "场次一",
        beatType: "setup",
        beatTask: "展示旧世界。",
        duration: 20,
        narrativeMode: "full",
        contentSummary: "马司令逼近万一山，要求交易。",
      },
    ],
    "△ 马司令逼近万一山。\n马司令：哈哈，那正好！\n万一山：我若是不做呢？"
  )
  assert.match(reinforcedScenes[0].contentSummary, /台词原文：/)
  assert.match(reinforcedScenes[0].contentSummary, /马司令：哈哈，那正好！/)

  const faithfulInjectedPlot = `${buildFaithfulHeader(true, true, assets)}\n△ 马司令逼近万一山。\n马司令：哈哈，那正好！\n万一山：我若是不做呢？`
  const faithfulReinforcedScenes = reinforceDialogueInSceneSummaries(
    [
      {
        id: "scene_faithful_dialogue",
        name: "场次一",
        beatType: "setup",
        beatTask: "展示旧世界。",
        duration: 20,
        narrativeMode: "full",
        contentSummary: "马司令逼近万一山，要求交易。",
      },
    ],
    faithfulInjectedPlot
  )
  assert.match(faithfulReinforcedScenes[0].contentSummary, /马司令：哈哈，那正好！/)
  assert.doesNotMatch(faithfulReinforcedScenes[0].contentSummary, /1:1 视觉化/)

  const scene: Scene = {
    id: "scene_001",
    name: "场次一",
    beatType: "setup",
    beatTask: "展示主角在旧世界的日常，埋下后续会被呼应的道具。",
    duration: 24,
    narrativeMode: "full",
    contentSummary: "万一山在洞口空地检查中毒者，发现蛊毒线索。",
  }
  const bridgeState: BridgeState = {
    charPosition: "万一山蹲在中毒者身侧",
    lightPhase: "冷月侧逆光",
    environment: "洞口空地",
    keyProp: "银针",
  }

  const { systemPrompt, userPrompt } = buildStageBPrompt(
    scene,
    0,
    3,
    0,
    bridgeState,
    baseOptions
  )

  assert.match(systemPrompt, /第 1\/3 个场次/)
  assert.match(systemPrompt, /视觉衔接约束/)
  assert.match(systemPrompt, /银针/)
  assert.match(systemPrompt, /本场次任务是：展示主角在旧世界的日常/)
  assert.match(systemPrompt, /资产一致性/)
  assert.match(userPrompt, /本场次剧本/)
  assert.match(userPrompt, /蛊毒线索/)

  const noBridgeScene: Scene = {
    ...scene,
    beatTask: "",
    contentSummary: "万一山起身望向墓口，决定继续前进。",
  }
  const noBridgePrompt = buildStageBPrompt(
    noBridgeScene,
    1,
    3,
    24,
    null,
    {
      ...baseOptions,
      isSTCEnabled: false,
    }
  )
  assert.doesNotMatch(noBridgePrompt.systemPrompt, /视觉衔接约束/)
  assert.match(noBridgePrompt.systemPrompt, /直接视觉化模式/)
  assert.match(noBridgePrompt.systemPrompt, /忠实视觉化本场摘要/)

  const config = getPromptConfig()
  assert.equal(typeof config.systemPrompts.stageBSystemPrompt, "string")

  console.log("source-chain regression passed")
}

main()
