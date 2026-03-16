import React, { useState } from 'react';
import { 
  Film, Library, Settings, Play, Download, Wand2, 
  ChevronDown, MessageSquare, CheckCircle2, AlertTriangle, 
  RefreshCw, Copy, Users, Image as ImageIcon, Box,
  Upload, Search, ShieldCheck, Filter, Monitor, Video, 
  Aperture, Music, Type, Sliders, PanelRight, Trash2, Save,
  FolderDown, FileImage, ImagePlus, Settings2,
  Clock, MoreHorizontal, Sparkles, LayoutList, GripVertical, ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('setup'); // 默认展示筹备页，可自由切换
  
  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-800 overflow-hidden">
      
      {/* 全局极简侧边栏 */}
      <aside className="w-[72px] bg-zinc-950 flex flex-col items-center py-6 border-r border-zinc-900 shrink-0 z-20">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-500/20">
          <Film size={22} />
        </div>
        <nav className="flex flex-col gap-4 w-full">
          <NavItem 
            icon={<Wand2 size={22} />} label="筹备" 
            active={activeView === 'setup'} onClick={() => setActiveView('setup')} 
          />
          <NavItem 
            icon={<Library size={22} />} label="资产" 
            active={activeView === 'assets'} onClick={() => setActiveView('assets')} 
          />
          <NavItem 
            icon={<Film size={22} />} label="分镜" 
            active={activeView === 'editor'} onClick={() => setActiveView('editor')} 
          />
        </nav>
        <div className="mt-auto flex flex-col gap-4 w-full">
          <NavItem icon={<Settings size={22} />} label="设置" active={false} onClick={() => {}} />
        </div>
      </aside>

      {/* 主视图区 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeView === 'setup' && <SetupView onNext={() => setActiveView('assets')} />}
        {activeView === 'assets' && <AssetsView onGenerate={() => setActiveView('editor')} />}
        {activeView === 'editor' && <EditorView />}
      </main>

    </div>
  );
}

/* =========================================
   视图 1：创作设置区 (Setup) 
========================================= */
function SetupView({ onNext }) {
  const [shotCountType, setShotCountType] = useState('auto'); 
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);
  
  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      
      {/* 顶部操作栏 */}
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="text-base font-bold text-zinc-800 tracking-tight">创作筹备</h1>
        <button
          onClick={onNext}
          className="px-6 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-600 transition-colors flex items-center gap-2"
        >
          下一步：配置视觉资产
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">

        {/* 中栏：核心剧情与生成逻辑 */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="w-full max-w-2xl space-y-8 pb-10">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">剧本与结构解析</h2>
              <p className="text-sm text-zinc-500 mt-1">输入剧本并设定引擎分析规则</p>
            </div>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600"/> 
                  核心情节
                </h2>
                <div className="flex items-center gap-2">
                  <button className="text-xs font-medium text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition flex items-center gap-1.5">
                    <Upload size={14} /> 导入剧本
                  </button>
                  <div className="w-px h-4 bg-zinc-200 mx-1"></div>
                  <button className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5">
                    <Search size={14} /> 纠错检查
                  </button>
                  <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1.5">
                    <Wand2 size={14} /> AI 分析扩写
                  </button>
                </div>
              </div>
              <textarea 
                className="w-full h-56 p-4 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all leading-relaxed"
                placeholder="在此输入或粘贴剧本内容..."
                defaultValue="雨夜的哥谭市，霓虹灯在积水的路面反光。一个穿着黑色风衣的男人背对镜头，正凝视着远处的韦恩塔。突然，警报声划破夜空..."
              />
              
              <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-x-6 gap-y-4">
                <ToggleSwitch label="保真模式 (严格遵守原意)" defaultChecked={false} icon={<ShieldCheck size={14}/>} />
                <ToggleSwitch label="审核预检 (违规词拦截)" defaultChecked={true} icon={<AlertTriangle size={14}/>} />
                <ToggleSwitch label="开启过滤词" defaultChecked={true} icon={<Filter size={14}/>} />
                <ToggleSwitch label="生成 BGM" defaultChecked={true} icon={<Music size={14}/>} />
                <ToggleSwitch label="生成字幕" defaultChecked={true} icon={<Type size={14}/>} />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <Monitor size={18} className="text-indigo-600"/> 
                  基础规格与题材
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  <SelectGroup label="故事题材" value="科幻悬疑" />
                  <SelectGroup label="画面比例" value="16:9 电影宽屏" />
                  <SelectGroup label="画质等级" value="4K 极致电影感" />
                </div>
              </div>

              <div className="h-px bg-zinc-100 w-full"></div>

              <div>
                <h2 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600"/> 
                  分镜节奏控制
                </h2>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2">视频总时长 (秒)</label>
                    <input 
                      type="number" defaultValue={30}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-2">分镜数量拆分</label>
                    <div className="flex items-center gap-2">
                      <select 
                        className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 outline-none hover:border-indigo-300 transition appearance-none cursor-pointer"
                        value={shotCountType} onChange={(e) => setShotCountType(e.target.value)}
                      >
                        <option value="auto">AI 智能计算节奏</option>
                        <option value="manual">指定固定镜数</option>
                      </select>
                      {shotCountType === 'manual' && (
                        <input 
                          type="number" defaultValue={10}
                          className="w-20 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition text-center"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 右侧组合栏：滑出式面板 + 常驻图标列 */}
        <div className="flex h-full shrink-0 z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className={`bg-white border-zinc-200 overflow-hidden transition-all duration-300 ease-in-out ${isRightDrawerOpen ? 'w-[320px] border-l' : 'w-0 border-l-0'}`}>
            <div className="w-[320px] h-full flex flex-col">
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                <h3 className="text-sm font-bold text-zinc-800">全局视觉参数</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Aperture size={14}/> 视觉美学</h4>
                  <SelectGroup label="导演风格" value="克里斯托弗·诺兰" />
                  <SelectGroup label="视觉风格" value="赛博朋克 / Cyberpunk" />
                  <SelectGroup label="全局影调" value="高反差冷色调 (Teal & Orange)" />
                  <SelectGroup label="运镜偏好" value="沉稳缓慢 (推拉为主)" />
                </div>
              </div>
            </div>
          </div>

          <aside className="w-[64px] bg-zinc-50 border-l border-zinc-200 flex flex-col items-center py-5 space-y-6 shrink-0 h-full z-20">
            <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className={`p-2 border shadow-sm rounded-xl transition ${isRightDrawerOpen ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100'}`} title="切换面板">
              <PanelRight size={18}/>
            </button>
            <div className="w-8 h-px bg-zinc-200"></div>
            <button onClick={() => setIsRightDrawerOpen(true)} className={`p-2 rounded-xl transition ${isRightDrawerOpen ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="视觉美学">
              <Aperture size={20}/>
            </button>
          </aside>
        </div>

      </div>
    </div>
  );
}

/* =========================================
   视图 2：资产管理 (Assets) - 结合右侧工具抽屉
========================================= */
function AssetsView({ onGenerate }) {
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);
  const [activeSlots, setActiveSlots] = useState({ character: 1, scene: null, prop: null });

  const [assets] = useState({
    character: { 
      1: { name: '刘建明', desc: '男性，30岁左右，短发黑色，穿着警察制服，体型中等偏瘦，眼神坚定，气质冷峻。' },
      2: { name: '陈永仁', desc: '男性，留着胡茬，皮夹克内搭衬衫。' }
    },
    scene: { 1: { name: '警校训练场', desc: '开阔的户外训练场，阳光刺眼，沥青地面。' } },
    prop: { 1: { name: '警服', desc: '深蓝色香港警察夏季制服。' } }
  });

  const toggleSlot = (category, slot) => {
    setActiveSlots(prev => ({ ...prev, [category]: prev[category] === slot ? null : slot }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      
      {/* 头部：标题与全局操作 */}
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-10">
        <h1 className="text-base font-bold text-zinc-800 tracking-tight flex items-center gap-2">
          🗂️ 数字资产库 (Asset Library)
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-100/50 px-3 py-1.5 rounded-lg border border-zinc-200/50 hidden sm:flex">
            <span className="text-[10px] font-bold text-zinc-500 mr-1">资产占比:</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">角色 2</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">场景 1</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">道具 1</span>
          </div>
          <div className="w-px h-4 bg-zinc-200"></div>
          <button 
            onClick={onGenerate}
            className="px-5 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-indigo-600 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Play size={14} fill="currentColor" /> 生成导演级分镜
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 左侧：资产块主工作区 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <AssetCategoryBlock 
              title="角色设定 (Character)" icon={Users} theme="indigo" type="人物"
              data={assets.character} activeSlot={activeSlots.character} onToggle={(slot) => toggleSlot('character', slot)}
            />
            <AssetCategoryBlock 
              title="场景设定 (Scene)" icon={ImageIcon} theme="emerald" type="图片"
              data={assets.scene} activeSlot={activeSlots.scene} onToggle={(slot) => toggleSlot('scene', slot)}
            />
            <AssetCategoryBlock 
              title="道具资产 (Props)" icon={Box} theme="amber" type="道具"
              data={assets.prop} activeSlot={activeSlots.prop} onToggle={(slot) => toggleSlot('prop', slot)}
            />
          </div>
        </div>

        {/* 右侧组合栏：滑出式面板 + 常驻图标列 */}
        <div className="flex h-full shrink-0 z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          
          <div className={`bg-white border-zinc-200 overflow-hidden transition-all duration-300 ease-in-out ${isRightDrawerOpen ? 'w-[320px] border-l' : 'w-0 border-l-0'}`}>
            <div className="w-[320px] h-full flex flex-col">
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                <h3 className="text-sm font-bold text-zinc-800">资产高级工具</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                {/* 继承项目 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><FolderDown size={14}/> 继承项目</h4>
                  <SelectGroup label="选择历史项目" value="[科幻] 赛博哥谭前传" />
                  <button className="w-full py-2 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg hover:bg-zinc-200 transition">
                    拉取全部资产设定
                  </button>
                </div>
                <div className="h-px bg-zinc-100 w-full"></div>
                
                {/* 图片反推 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><FileImage size={14}/> 图片反推提示词</h4>
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-5 flex flex-col items-center justify-center text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 cursor-pointer transition bg-zinc-50">
                    <Upload size={20} className="mb-2"/>
                    <span className="text-xs font-medium">点击或拖拽上传参考图</span>
                  </div>
                </div>
                <div className="h-px bg-zinc-100 w-full"></div>
                
                {/* 一键生图 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><ImagePlus size={14}/> 视觉概念图</h4>
                  <button className="w-full py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-2">
                    <Wand2 size={14} /> 一键批量生成资产图
                  </button>
                </div>
                <div className="h-px bg-zinc-100 w-full"></div>
                
                {/* 图片参数 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Settings2 size={14}/> 生图引擎参数</h4>
                  <SelectGroup label="生图大模型" value="Midjourney v6" />
                  <SelectGroup label="风格化程度 (Stylize)" value="中等 (250)" />
                </div>
              </div>
            </div>
          </div>

          <aside className="w-[64px] bg-zinc-50 border-l border-zinc-200 flex flex-col items-center py-5 space-y-6 shrink-0 h-full z-20">
            <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className={`p-2 border shadow-sm rounded-xl transition ${isRightDrawerOpen ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100'}`} title="切换面板">
              <PanelRight size={18}/>
            </button>
            <div className="w-8 h-px bg-zinc-200"></div>
            <button onClick={() => setIsRightDrawerOpen(true)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="继承项目"><FolderDown size={20}/></button>
            <button onClick={() => setIsRightDrawerOpen(true)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="图片反推"><FileImage size={20}/></button>
            <button onClick={() => setIsRightDrawerOpen(true)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="视觉概念图"><ImagePlus size={20}/></button>
            <button onClick={() => setIsRightDrawerOpen(true)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="生图引擎参数"><Settings2 size={20}/></button>
          </aside>

        </div>

      </div>
    </div>
  );
}

/* =========================================
   视图 3：分镜工作台 (EditorView) - NLE + IDE 融合体
========================================= */
function EditorView() {
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);
  
  // 模拟链式生成状态数据
  const [shots] = useState([
    { 
      id: 1, num: '01', time: '00:00 - 00:05', duration: 5, status: 'success', camera: '全景 / 缓慢推镜', 
      desc: '雨夜的哥谭市，霓虹灯在积水的路面反光。', 
      qa: { passed: true, msg: '符合 BS2 铺垫开场节奏' },
      prompt: { lens: '全景，缓慢推镜', env: '在 @场景1 ，霓虹灯闪烁，积水反光', char: '无明显主体', detail: '雨滴特写，赛博朋克氛围，水面波纹', light: '高反差冷色调 (Teal & Orange)，暗部偏蓝', audio: '沉重的淅沥雨声，远处的警笛混响' }
    },
    { 
      id: 2, num: '02', time: '00:05 - 00:08', duration: 3, status: 'warning', camera: '特写 / 固定', 
      desc: '一个穿着黑色风衣的男人背对镜头，正凝视着远处的韦恩塔。', 
      qa: { passed: false, msg: '资产警告：@人物1 详情中未定义"黑色风衣"' },
      prompt: { lens: '特写，固定镜头，浅景深 (DOF)', env: '模糊的城市夜景背景', char: '@人物1 正在 抽烟，背影，肩膀微耸', detail: '风衣下摆随风轻摆，烟雾缭绕', light: '背光轮廓光 (Rim Light)', audio: '打火机清脆声，深呼吸' }
    },
    { 
      id: 3, num: '03', time: '00:08 - 00:15', duration: 7, status: 'generating', camera: '跟随 / 快速摇镜', 
      desc: '突然，急促的警报声划破夜空，男人猛地转头，眼神锐利。', 
      qa: null, prompt: null 
    },
    { 
      id: 4, num: '04', time: '00:15 - 00:20', duration: 5, status: 'waiting', camera: '', 
      desc: '男人将烟头弹入水坑，转身走向阴影深处。', 
      qa: null, prompt: null 
    }
  ]);

  const [activeShotId, setActiveShotId] = useState(2); // 当前聚焦用于右侧QA面板联动的镜头

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      
      {/* 头部操作栏 */}
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-zinc-800 tracking-tight flex items-center gap-2">
            🎬 分镜工作台 (Director's Cut)
          </h1>
          <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-md font-mono">Total: 30s</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition flex items-center gap-1.5">
            <Download size={14} /> 导出脚本
          </button>
          <button className="px-4 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-indigo-600 rounded-lg shadow-sm transition flex items-center gap-1.5">
            <Copy size={14} /> 复制全量提示词
          </button>
        </div>
      </header>

      {/* 宏观时间线 (Timeline Track) */}
      <div className="h-10 bg-white border-b border-zinc-200 flex items-center px-6 gap-1.5 shrink-0">
        {shots.map(s => (
          <div 
            key={s.id} 
            title={`Shot ${s.num}: ${s.status}`}
            className={`h-4 rounded-full cursor-pointer transition-all hover:opacity-80
              ${s.status === 'success' ? 'bg-emerald-500' : 
                s.status === 'warning' ? 'bg-amber-400' : 
                s.status === 'generating' ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-200'}
              ${activeShotId === s.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
            style={{ flex: s.duration }}
            onClick={() => setActiveShotId(s.id)}
          />
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 中栏主工作区：结构化分镜流 */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-5 pb-32">
            {shots.map(shot => (
              <ShotCard 
                key={shot.id} 
                shot={shot} 
                isActive={activeShotId === shot.id}
                onClick={() => setActiveShotId(shot.id)}
              />
            ))}
          </div>
        </div>

        {/* 右侧抽屉：上下文助手 (Context Assistant) */}
        <div className="flex h-full shrink-0 z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className={`bg-white border-zinc-200 overflow-hidden transition-all duration-300 ease-in-out ${isRightDrawerOpen ? 'w-[320px] border-l' : 'w-0 border-l-0'}`}>
            <div className="w-[320px] h-full flex flex-col">
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
                <h3 className="text-sm font-bold text-zinc-800">导演上下文助手</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                
                {/* 剧本锚点 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><MessageSquare size={14}/> 剧本锚点 (Shot {shots.find(s=>s.id===activeShotId)?.num})</h4>
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm text-indigo-900 leading-relaxed relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 rounded-l-xl"></div>
                    "{shots.find(s=>s.id===activeShotId)?.desc || '...'}"
                  </div>
                </div>
                
                <div className="h-px bg-zinc-100 w-full"></div>
                
                {/* 导演 QA 面板 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck size={14}/> 自动化质检 (QA Panel)</h4>
                  {shots.find(s=>s.id===activeShotId)?.status === 'warning' ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-2 text-amber-800 text-sm font-bold">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" /> 发现 1 个逻辑冲突
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        **资产预警**：底层提示词中出现了“黑色风衣”，但您在资产库中定义 @人物1 时未包含此设定。建议一键添加至资产库或修改提示词。
                      </p>
                      <button className="w-full py-1.5 bg-amber-200/50 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-200 transition">
                        一键同步至资产库
                      </button>
                    </div>
                  ) : shots.find(s=>s.id===activeShotId)?.status === 'success' ? (
                     <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
                       <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                       <div>
                         <div className="text-emerald-800 text-sm font-bold mb-1">通过双重魔法检测</div>
                         <p className="text-xs text-emerald-700">符合 BS2 节拍，未发现敏感或陈词滥调词汇。</p>
                       </div>
                     </div>
                  ) : (
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500 text-center">
                      等待生成完成后出具报告...
                    </div>
                  )}
                </div>

                <div className="h-px bg-zinc-100 w-full"></div>
                
                {/* 快捷替换池 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Settings size={14}/> 运镜快捷池</h4>
                  <div className="flex flex-wrap gap-2">
                    {['大特写 (ECU)', '推移 (Push in)', '跟随跟拍', '低视角 (Low Angle)', '越过肩膀 (OTS)'].map(tag => (
                      <span key={tag} className="px-2.5 py-1.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 常驻图标列 */}
          <aside className="w-[64px] bg-zinc-50 border-l border-zinc-200 flex flex-col items-center py-5 space-y-6 shrink-0 h-full z-20">
            <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className={`p-2 border shadow-sm rounded-xl transition ${isRightDrawerOpen ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100'}`} title="切换面板">
              <PanelRight size={18}/>
            </button>
            <div className="w-8 h-px bg-zinc-200"></div>
            <button onClick={() => setIsRightDrawerOpen(true)} className={`p-2 rounded-xl transition ${isRightDrawerOpen ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="剧本锚点"><MessageSquare size={20}/></button>
            <button onClick={() => setIsRightDrawerOpen(true)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="自动化质检"><ShieldCheck size={20}/></button>
            <button onClick={() => setIsRightDrawerOpen(true)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="快捷替换池"><Settings size={20}/></button>
          </aside>
          
        </div>

      </div>
    </div>
  );
}

/* =========================================
   单镜卡片组件 (ShotCard) - 实现渐进式揭示与 IDE 编辑感
========================================= */
function ShotCard({ shot, isActive, onClick }) {
  const [isExpanded, setIsExpanded] = useState(shot.status === 'success' || shot.status === 'warning');

  const statusStyles = {
    success: { border: 'border-zinc-200 hover:border-indigo-300', badge: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={14}/> },
    warning: { border: 'border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]', badge: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={14}/> },
    generating: { border: 'border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]', badge: 'bg-indigo-100 text-indigo-700', icon: <RefreshCw size={14} className="animate-spin"/> },
    waiting: { border: 'border-zinc-200 opacity-60 hover:opacity-100', badge: 'bg-zinc-100 text-zinc-500', icon: <Clock size={14}/> }
  };
  const st = statusStyles[shot.status];

  const renderCodeText = (text) => {
    if (!text) return null;
    return text.split(/(@\S+)/).map((part, i) => 
      part.startsWith('@') 
        ? <span key={i} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">{part}</span> 
        : part
    );
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-default
        ${st.border} ${isActive ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-sm'}`}
    >
      
      {/* 头部 (Header) */}
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 group">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 bg-zinc-200 rounded text-xs font-black text-zinc-600 cursor-grab active:cursor-grabbing"><GripVertical size={14}/></div>
          <span className="text-xs font-black bg-zinc-900 text-white px-2 py-1 rounded">Shot {shot.num}</span>
          <span className="text-xs font-bold text-zinc-400 font-mono">{shot.time}</span>
          
          {shot.camera && (
            <>
              <div className="h-3 w-px bg-zinc-300 mx-1"></div>
              <span className="text-xs font-medium text-zinc-600 bg-white border border-zinc-200 px-2.5 py-0.5 rounded shadow-sm">{shot.camera}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${st.badge}`}>
            {st.icon} 
            {shot.status === 'success' ? 'QA Pass' : shot.status === 'warning' ? '需审核' : shot.status === 'generating' ? '引擎计算中...' : '等待进入队列'}
          </div>
          <button className="text-zinc-400 hover:text-zinc-800 transition p-1"><MoreHorizontal size={16}/></button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`text-zinc-400 hover:text-indigo-600 transition p-1 transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          >
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>

      {/* 画面白话描述 (Scene Description - 始终显示) */}
      <div className="px-5 py-4 bg-white relative">
        <div className="flex gap-3">
          <MessageSquare size={16} className="text-zinc-300 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-600 leading-relaxed font-medium">{shot.desc}</p>
        </div>
      </div>

      {/* 展开态：IDE 伪代码编辑器 (Body) */}
      {isExpanded && shot.prompt && (
        <div className="bg-zinc-950 border-t border-zinc-800 p-5 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><LayoutList size={14}/> 底层 6 维约束 (Prompt Engine)</h4>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-zinc-900 px-2 py-1 rounded border border-zinc-800"><Box size={12} className="text-indigo-400"/> @标签激活</span>
            </div>
          </div>
          
          {/* 伪代码编辑流 */}
          <div className="space-y-3 font-mono text-sm">
            
            <PromptField label="[镜头]" value={shot.prompt.lens} color="text-amber-400" />
            <PromptField label="[环境]" value={shot.prompt.env} color="text-emerald-400" renderer={renderCodeText} />
            <PromptField label="[角色]" value={shot.prompt.char} color="text-indigo-400" renderer={renderCodeText} />
            <PromptField label="[细节]" value={shot.prompt.detail} color="text-rose-400" />
            <PromptField label="[光影]" value={shot.prompt.light} color="text-cyan-400" />
            <PromptField label="[音效]" value={shot.prompt.audio} color="text-zinc-400" />

          </div>

          {/* 底部行动按钮 (Footer) */}
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-zinc-800/50">
            <button className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition flex items-center gap-1.5 border border-zinc-800">
              <Copy size={12} /> 复制底层 Prompt
            </button>
            <button className="px-3 py-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg transition flex items-center gap-1.5 border border-indigo-500/30">
              <Sparkles size={12} /> AI 智能润色
            </button>
            <button className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition flex items-center gap-1.5">
              <RefreshCw size={12} /> 重新推演此镜
            </button>
          </div>
        </div>
      )}

      {/* 生成中状态遮罩 */}
      {shot.status === 'generating' && (
        <div className="px-5 py-4 bg-indigo-50/50 border-t border-indigo-100 flex items-center justify-center gap-3 text-sm font-bold text-indigo-600">
          <RefreshCw size={16} className="animate-spin" /> 正在进行视觉化推演与防崩坏计算...
        </div>
      )}

    </div>
  );
}

// 辅助组件：伪代码输入行
function PromptField({ label, value, color, renderer }) {
  return (
    <div className="flex items-start gap-3 group">
      <span className={`font-bold shrink-0 w-16 pt-[2px] ${color} select-none`}>{label}</span>
      <div className="relative flex-1">
        {/* 展示层 (解析了的高亮标签) */}
        <div className={`w-full bg-transparent text-zinc-300 leading-relaxed break-words min-h-[24px]`}>
          {renderer ? renderer(value) : value}
        </div>
        {/* 交互编辑层 (绝对定位覆盖在上面，透明的输入框，聚焦时显示边框) */}
        <textarea 
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white outline-none resize-none border-b border-transparent focus:border-zinc-700 transition-colors z-10 font-inherit overflow-hidden"
          defaultValue={value}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

/* =========================================
   辅助 UI 组件：资产分类区块 
========================================= */
function AssetCategoryBlock({ title, icon: Icon, theme, type, data, activeSlot, onToggle }) {
  const themes = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', ring: 'focus:ring-indigo-500', activeChip: 'border-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.2)]' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'focus:ring-emerald-500', activeChip: 'border-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.2)]' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'focus:ring-amber-500', activeChip: 'border-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.2)]' }
  };
  const t = themes[theme];
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-100">
        <h2 className={`text-sm font-bold flex items-center gap-2 ${t.text}`}>
          <Icon size={18} /> {title}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400 font-medium">全局替换标识：@{type}1-10</span>
          <ToggleSwitch label="@标签引用" defaultChecked={true} icon={<Box size={14}/>} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-2">
        {slots.map(slot => {
          const item = data[slot];
          const isFilled = !!item?.name || !!item?.desc;
          const isActive = activeSlot === slot;

          return (
            <button
              key={slot} onClick={() => onToggle(slot)}
              className={`flex flex-col items-center justify-center w-[88px] h-[52px] rounded-xl border transition-all duration-200 relative overflow-hidden group
                ${isActive ? `bg-white ${t.activeChip} z-10 scale-105` : 
                  isFilled ? `${t.bg} ${t.border} hover:opacity-80` : 
                  'bg-zinc-50 border-zinc-200 border-dashed hover:bg-zinc-100 hover:border-zinc-300'}`}
            >
              <span className={`text-[11px] font-black tracking-wide ${isFilled || isActive ? t.text : 'text-zinc-400'}`}>@{type}{slot}</span>
              {isFilled && <span className={`text-[10px] font-medium truncate w-[72px] text-center mt-0.5 ${t.text} opacity-80`}>{item.name}</span>}
              {!isFilled && !isActive && <span className="w-1 h-1 rounded-full bg-zinc-300 mt-1.5 group-hover:bg-zinc-400 transition-colors"></span>}
            </button>
          );
        })}
      </div>

      {activeSlot && (
        <div className={`mt-4 p-5 rounded-xl border ${t.border} bg-zinc-50 relative animate-[fadeIn_0.2s_ease-out]`}>
          <div className={`absolute -top-1.5 left-8 w-2.5 h-2.5 bg-zinc-50 border-l border-t ${t.border} rotate-45 transform origin-center hidden sm:block`}></div>
          <div className="flex justify-between items-center mb-3 relative z-10">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg bg-white border ${t.border} ${t.text} shadow-sm`}>@{type}{activeSlot}</span>
              <input type="text" placeholder="输入资产名称 (如: 刘建明)" defaultValue={data[activeSlot]?.name || ''}
                className={`text-sm font-bold bg-transparent border-b border-dashed border-zinc-300 px-1 py-0.5 w-40 outline-none focus:border-zinc-600 transition-colors ${t.text} placeholder:text-zinc-300`}
              />
            </div>
            <div className="flex gap-2">
              <button className="text-[10px] font-medium text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition shadow-sm flex items-center gap-1.5"><ImageIcon size={12} /> 上传参考图</button>
              <button className="text-[10px] font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1.5"><Trash2 size={12} /> 清空此位</button>
            </div>
          </div>
          <textarea
            placeholder={`详细描述该${type}的视觉特征（外貌、材质、颜色等），这将被注入到 AI 生成的提示词中...`}
            defaultValue={data[activeSlot]?.desc || ''}
            className={`w-full h-24 p-3.5 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-xl outline-none resize-none focus:ring-2 ${t.ring} focus:border-transparent transition leading-relaxed shadow-inner`}
          />
          <div className="flex justify-end mt-2"><span className="text-[10px] text-zinc-400 flex items-center gap-1"><CheckCircle2 size={10} className={t.text} /> 自动保存</span></div>
        </div>
      )}
    </section>
  );
}

/* =========================================
   通用辅助 UI 组件
========================================= */
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-3 gap-1 relative transition-colors ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
      {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-md"></div>}
      {icon}
      <span className="text-[10px] font-bold mt-1 tracking-wide">{label}</span>
    </button>
  );
}

function SelectGroup({ label, value }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-500 block mb-1.5">{label}</label>
      <div className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 flex justify-between items-center cursor-pointer hover:border-indigo-300 transition relative">
        <span className="truncate pr-4">{value}</span>
        <ChevronDown size={16} className="text-zinc-400 absolute right-3" />
      </div>
    </div>
  );
}

function ToggleSwitch({ label, defaultChecked, icon }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
        <div className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
      </div>
      <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 group-hover:text-zinc-900 transition-colors">
        {icon}
        {label}
      </span>
      <input type="checkbox" className="hidden" checked={checked} onChange={() => setChecked(!checked)} />
    </label>
  );
}