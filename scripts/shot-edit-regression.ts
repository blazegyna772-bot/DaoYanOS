import assert from "node:assert/strict"
import {
  enforceTargetOnlyChanges,
  parseShotsFromResponse,
  recalculateShotTimeRanges,
  resolveShotEditContext,
} from "../src/lib/shotEdit"
import type { Shot } from "../src/types"

function makeShot(overrides: Partial<Shot>): Shot {
  return {
    id: "shot_default",
    sceneId: "scene_001",
    index: 1,
    globalIndex: 1,
    type: "中景",
    duration: 3,
    timeRange: "0-3s",
    env: "客厅",
    action: "@人物1 坐在沙发上",
    light: "暖黄顶灯",
    tension: "平静",
    seedancePrompt: "镜头：中景推镜 环境：客厅 角色分动：@人物1 坐在沙发上 细节：@人物1 平静等待 光影：暖黄顶灯 台词(@人物1)：我回来了 音效：门响",
    camera: "推镜",
    sound: "门响",
    dialogue: "我回来了",
    ...overrides,
  }
}

function main() {
  const allShots: Shot[] = [
    makeShot({
      id: "shot_1",
      sceneId: "scene_A",
      index: 1,
      globalIndex: 1,
      duration: 3,
      timeRange: "0-3s",
      dialogue: "我回来了",
    }),
    makeShot({
      id: "shot_2",
      sceneId: "scene_A",
      index: 2,
      globalIndex: 2,
      duration: 4,
      timeRange: "3-7s",
      type: "近景",
      action: "@人物1 伸手去摸开关",
      seedancePrompt: "镜头：近景摇镜 环境：客厅 角色分动：@人物1 伸手去摸开关 细节：@人物1 神情迟疑 光影：走廊逆光 台词(@人物1)：先别开灯 音效：脚步声",
      camera: "摇镜",
      sound: "脚步声",
      dialogue: "先别开灯",
    }),
    makeShot({
      id: "shot_3",
      sceneId: "scene_B",
      index: 1,
      globalIndex: 3,
      duration: 5,
      timeRange: "7-12s",
      env: "楼道",
      action: "@人物2 站在门外",
      seedancePrompt: "镜头：全景 环境：楼道 角色分动：@人物2 站在门外 细节：@人物2 侧耳倾听 光影：冷白廊灯 台词(@人物2)：里面有人吗 音效：风声",
      camera: "固定",
      sound: "风声",
      dialogue: "里面有人吗",
    }),
  ]

  const sceneScopedContext = resolveShotEditContext(allShots, ["shot_2"])
  assert.equal(sceneScopedContext.sceneScoped, true)
  assert.equal(sceneScopedContext.sceneId, "scene_A")
  assert.deepEqual(sceneScopedContext.relativeShotIndices, [2])
  assert.equal(sceneScopedContext.contextShots.length, 2)

  const crossSceneContext = resolveShotEditContext(allShots, ["shot_1", "shot_3"])
  assert.equal(crossSceneContext.sceneScoped, false)
  assert.equal(crossSceneContext.sceneId, null)
  assert.deepEqual(crossSceneContext.relativeShotIndices, [1, 3])

  const markdownResponse = [
    "| 时间段 | 景别 | 运镜 | 画面内容 | 光影氛围 | 戏剧张力 | SEEDANCE提示词 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 0-3s | 中景 | 推镜 | 客厅；@人物1 坐在沙发上 | 暖黄顶灯 | 平静 | 镜头：中景推镜 环境：客厅 角色分动：@人物1 坐在沙发上 细节：@人物1 平静等待 光影：暖黄顶灯 台词(@人物1)：我回来了 音效：门响 |",
    "| 3-8s | 特写 | 推近 | 客厅；@人物1 伸手去摸开关 | 走廊逆光 | 紧张↑ | 镜头：特写推近 环境：客厅 角色分动：@人物1 伸手去摸开关 细节：@人物1 呼吸发紧 光影：走廊逆光 台词(@人物1)：把灯打开 音效：开关轻响 |",
  ].join("\n")

  const parsed = parseShotsFromResponse(markdownResponse, sceneScopedContext.contextShots, ["shot_2"])
  assert.equal(parsed.error, undefined)

  const enforced = enforceTargetOnlyChanges(sceneScopedContext.contextShots, parsed.shots, ["shot_2"])
  assert.equal(enforced[0].seedancePrompt, sceneScopedContext.contextShots[0].seedancePrompt)
  assert.equal(enforced[1].type, "特写")
  assert.equal(enforced[1].duration, 5)
  assert.equal(enforced[1].dialogue, "先别开灯")
  assert.match(enforced[1].seedancePrompt, /台词\(@人物1\)：先别开灯/)
  assert.doesNotMatch(enforced[1].seedancePrompt, /把灯打开/)

  const quotedShot = makeShot({
    id: "shot_quoted",
    sceneId: "scene_C",
    index: 1,
    globalIndex: 4,
    seedancePrompt: "镜头：中景推镜 环境：客厅 角色分动：@人物1 坐在沙发上 细节：@人物1 平静等待 光影：暖黄顶灯 台词(@人物1)：\"我回来了\" 音效：门响",
    dialogue: "我回来了",
  })
  const quotedEnforced = enforceTargetOnlyChanges(
    [quotedShot],
    [{
      ...quotedShot,
      seedancePrompt: "镜头：中景推镜 环境：客厅 角色分动：@人物1 坐在沙发上 细节：@人物1 呼吸发紧 光影：暖黄顶灯 台词(@人物1)：我不回来了 音效：门响",
      dialogue: "我不回来了",
    }],
    ["shot_quoted"]
  )
  assert.match(quotedEnforced[0].seedancePrompt, /台词\(@人物1\)："我回来了"/)
  assert.doesNotMatch(quotedEnforced[0].seedancePrompt, /我不回来了/)

  const recalculated = recalculateShotTimeRanges(enforced)
  assert.equal(recalculated[0].timeRange, "0-3s")
  assert.equal(recalculated[1].timeRange, "3-8s")

  const jsonResponse = JSON.stringify([
    {
      index: 1,
      type: "全景",
      duration: 6,
      timeRange: "0-6s",
      camera: "固定",
      env: "楼道",
      action: "@人物2 后退半步",
      light: "冷白廊灯",
      tension: "悬念→",
      seedancePrompt: "镜头：全景 环境：楼道 角色分动：@人物2 后退半步 细节：@人物2 紧张侧听 光影：冷白廊灯 台词(@人物2)：里面有人吗 音效：风声",
      sound: "风声",
      dialogue: "里面有人吗",
    },
  ])
  const jsonParsed = parseShotsFromResponse(jsonResponse, [allShots[2]], ["shot_3"])
  assert.equal(jsonParsed.error, undefined)
  assert.equal(jsonParsed.shots[0].duration, 6)
  assert.equal(jsonParsed.shots[0].type, "全景")

  console.log("shot-edit regression passed")
}

main()
