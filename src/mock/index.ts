/**
 * Mock 数据统一导出
 * 用于开发阶段静态页面搭建
 */

export { directors, getDirectorsByCategory, directorCategoryLabels } from "./directors";
export { mockProjects, createEmptyProject, samplePlots } from "./projects";

// 重新导出类型（方便使用）
export type { Director, DirectorCategory } from "@/types";
