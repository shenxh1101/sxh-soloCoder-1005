import { v4 as uuidv4 } from 'uuid'
import type { TranscriptSegment, Speaker } from '@/types'

interface ContentTemplate {
  id: string
  name: string
  texts: string[]
  description: string
}

const contentTemplates: ContentTemplate[] = [
  {
    id: 'ai',
    name: '人工智能专题',
    description: '关于AI技术发展与应用的讨论',
    texts: [
      '大家好，欢迎收听今天的节目，我们来聊聊人工智能在日常生活中的应用。',
      '确实，现在AI已经渗透到了我们生活的方方面面，从智能手机到智能家居，无处不在。',
      '没错，比如我们每天使用的语音助手，就是人工智能的一个典型应用。',
      '除此之外，在医疗领域，AI也在帮助医生进行更精准的诊断。',
      '说到医疗，我最近看到一个报道，AI在某些疾病的诊断准确率已经超过了资深医生。',
      '这确实是一个令人振奋的发展，但同时也带来了一些伦理和隐私方面的问题。',
      '对，数据隐私是一个非常重要的议题。我们如何在享受AI便利的同时保护个人隐私？',
      '这需要政府、企业和用户共同努力，建立完善的数据保护机制。',
      '另外，AI的普及也可能对就业市场产生影响，一些重复性的工作可能会被取代。',
      '但从另一个角度看，AI也会创造新的就业机会，比如AI训练师、数据标注师等。',
      '没错，关键在于持续学习，适应技术发展带来的变化。',
      '我们今天的讨论非常有意义，希望听众朋友们也能从中获得一些启发。',
      '感谢大家的收听，我们下期节目再见。',
    ],
  },
  {
    id: 'business',
    name: '商业访谈',
    description: '创业者和企业家的经验分享',
    texts: [
      '欢迎来到本期商业访谈，今天我们非常荣幸邀请到了一位资深创业者。',
      '您好，非常感谢您接受我们的采访。先和观众朋友们打个招呼吧。',
      '大家好，很高兴能有这个机会和大家分享我的创业经历。',
      '您是怎么想到要创办现在这家公司的？当时的契机是什么？',
      '其实早在五年前，我就发现了这个市场的痛点，但当时技术还不够成熟。',
      '直到两年前，随着技术的进步，我们觉得时机成熟了，就毅然决定创业。',
      '创业过程中遇到的最大挑战是什么？您是如何克服的？',
      '最大的挑战应该是团队建设和资金压力，那段时间确实很艰难。',
      '但我们团队非常团结，大家一起加班加点，最终挺过来了。',
      '对于想要创业的年轻人，您有什么建议？',
      '我觉得最重要的是坚持和学习，不要害怕失败，要从失败中吸取教训。',
      '另外，一定要找到自己真正热爱的事情，这样才有动力坚持下去。',
      '非常感谢您的分享，相信这些经验对很多人都有帮助。',
      '也感谢你们的邀请，希望我的经历能给大家带来一些启发。',
    ],
  },
  {
    id: 'health',
    name: '健康养生',
    description: '健康生活方式和医学知识科普',
    texts: [
      '欢迎大家收听今天的健康养生节目，我是你们的主持人。',
      '今天我们邀请到了著名的营养学专家，来和大家聊聊日常饮食的注意事项。',
      '主持人好，听众朋友们大家好，很高兴能和大家交流健康话题。',
      '首先想请教一下，我们常说的"早餐要吃好"，到底怎样才算好呢？',
      '早餐确实非常重要，理想的早餐应该包含蛋白质、碳水和膳食纤维。',
      '比如一个鸡蛋、一片全麦面包，再加上一份水果，就是比较均衡的搭配。',
      '那午餐和晚餐有什么需要注意的地方吗？',
      '午餐要吃饱，保证下午的工作精力；晚餐要吃少，避免给肠胃造成负担。',
      '现在很多年轻人喜欢熬夜，这对健康有什么影响？',
      '熬夜的危害非常大，会影响免疫系统、内分泌系统，还会加速衰老。',
      '建议大家尽量在晚上11点前入睡，保证7-8小时的睡眠时间。',
      '除了饮食和睡眠，运动方面有什么建议？',
      '每周至少进行3次中等强度的运动，每次30分钟以上，比如快走、游泳、骑车都是不错的选择。',
      '非常感谢您的专业建议，希望听众朋友们都能养成健康的生活习惯。',
    ],
  },
  {
    id: 'technology',
    name: '科技前沿',
    description: '最新科技产品和趋势解读',
    texts: [
      '欢迎来到科技前沿，我是主持人，今天我们来聊聊最近发布的几款重磅产品。',
      '首先是新款智能手机，在性能和影像方面都有很大升级。',
      '是的，这次的芯片采用了最新的制程工艺，性能提升非常明显。',
      '影像系统更是亮点，主摄传感器尺寸更大，夜景拍摄能力显著增强。',
      '除了手机，今年的笔记本电脑也有不少看点。',
      '尤其是搭载了新处理器的轻薄本，性能释放非常激进。',
      '续航方面也有所改善，办公使用基本能做到一天一充。',
      '说到这里，不得不提一下最近很火的AI PC概念。',
      'AI PC能够在本地运行大语言模型，不需要联网就能提供AI功能。',
      '这对隐私保护来说是个好消息，用户数据不需要上传到云端。',
      '未来几年，AI赋能会成为科技产品的主旋律。',
      '从手机到电脑，从智能家居到汽车，AI无处不在。',
      '作为消费者，我们要拥抱变化，同时也要理性看待技术发展。',
      '感谢收看今天的节目，我们下期继续聊科技。',
    ],
  },
  {
    id: 'culture',
    name: '文化访谈',
    description: '文化、艺术、历史相关话题',
    texts: [
      '欢迎来到文化大讲堂，今天我们来聊聊中国传统文化的现代价值。',
      '中国传统文化博大精深，包含了哲学、文学、艺术等多个方面。',
      '其中最核心的是儒家思想，强调仁、义、礼、智、信。',
      '这些价值观在今天依然有重要的指导意义。',
      '比如"己所不欲，勿施于人"，就是处理人际关系的黄金法则。',
      '除了儒家思想，道家和佛家思想也深深影响了中国人的思维方式。',
      '道家强调顺应自然，佛家强调因果轮回，这些都是宝贵的精神财富。',
      '在文学艺术方面，唐诗宋词、书法绘画都是中华文化的瑰宝。',
      '近年来，国潮兴起，年轻人对传统文化的兴趣越来越浓厚。',
      '这是一个很好的现象，说明我们的文化自信在不断增强。',
      '当然，传承传统文化不是要复古，而是要创造性转化、创新性发展。',
      '让古老的智慧在现代社会焕发新的生命力。',
      '希望更多人能了解和热爱我们的传统文化，做文化的传承者和传播者。',
      '今天的节目就到这里，感谢大家的收听。',
    ],
  },
  {
    id: 'lifestyle',
    name: '生活方式',
    description: '旅行、美食、生活感悟分享',
    texts: [
      '大家好，欢迎来到慢生活时间，今天我们来聊聊如何在忙碌中寻找平衡。',
      '现代生活节奏很快，很多人都感到焦虑和压力。',
      '其实，我们可以试着慢下来，感受生活中的小确幸。',
      '比如周末的时候，为自己做一顿丰盛的早餐。',
      '或者泡一杯茶，静静地看一会儿书，让大脑放空。',
      '旅行也是很好的放松方式，但不一定要去很远的地方。',
      '城市周边的小镇、郊外的公园，都能让我们暂时逃离喧嚣。',
      '重要的是心态，要学会在平凡的日子里发现美好。',
      '夕阳西下、雨后彩虹、孩子的笑脸，这些都是值得珍惜的瞬间。',
      '物质追求是无止境的，真正的幸福来自内心的平静和满足。',
      '希望大家都能找到适合自己的生活节奏，过上想要的生活。',
      '记住，工作是为了更好地生活，而不是反过来。',
      '今天的分享就到这里，祝大家都能拥有美好的一天。',
    ],
  },
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function generateMockTranscript(
  audioFileId: string,
  duration: number,
  speakers: Speaker[],
  audioFileName?: string
): TranscriptSegment[] {
  const hashInput = audioFileName || audioFileId
  const templateIndex = hashString(hashInput) % contentTemplates.length
  const template = contentTemplates[templateIndex]
  const segments: TranscriptSegment[] = []
  const avgSegmentDuration = 15
  const numSegments = Math.max(10, Math.floor(duration / avgSegmentDuration))
  let currentTime = 0

  const seed = hashString(hashInput)
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000
    return x - Math.floor(x)
  }

  for (let i = 0; i < numSegments; i++) {
    const segmentDuration = Math.min(
      avgSegmentDuration + pseudoRandom(i) * 10 - 5,
      duration - currentTime - 1
    )
    const speakerIndex = Math.floor(pseudoRandom(i + 1000) * speakers.length)
    const textIndex = i % template.texts.length

    let text = template.texts[textIndex]
    if (i >= template.texts.length) {
      const variationIndex = Math.floor(pseudoRandom(i + 2000) * template.texts.length)
      const baseText = template.texts[variationIndex]
      const variations = [
        baseText,
        baseText,
        `说到这里，我还想补充一点。${baseText}`,
        `${baseText}这是我们观察到的一个重要趋势。`,
      ]
      text = variations[Math.floor(pseudoRandom(i + 3000) * variations.length)]
    }

    segments.push({
      id: uuidv4(),
      audioFileId,
      startTime: currentTime,
      endTime: currentTime + Math.max(3, segmentDuration),
      text,
      speaker: speakers[speakerIndex].id,
      confidence: 0.8 + pseudoRandom(i + 4000) * 0.2,
      annotations: [],
      isDeleted: false,
      isHighlight: pseudoRandom(i + 5000) > 0.85,
      isAd: pseudoRandom(i + 6000) > 0.92,
    })

    currentTime += Math.max(3, segmentDuration)
    if (currentTime >= duration - 1) break
  }

  return segments
}

export function getTemplateForAudio(fileName: string): ContentTemplate {
  const templateIndex = hashString(fileName) % contentTemplates.length
  return contentTemplates[templateIndex]
}

export function getAllTemplates(): ContentTemplate[] {
  return contentTemplates
}

export function generateDemoProject() {
  const audioFiles = [
    {
      id: uuidv4(),
      name: '访谈节目_第一期.mp3',
      path: 'demo/audio/访谈节目_第一期.mp3',
      duration: 2400,
      sampleRate: 44100,
      size: 45678901,
      importedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: '科技播客_AI专题.wav',
      path: 'demo/audio/科技播客_AI专题.wav',
      duration: 3600,
      sampleRate: 48000,
      size: 123456789,
      importedAt: new Date().toISOString(),
    },
  ]

  const speakers = [
    { id: 'spk_0', name: '主持人', color: '#3b82f6' },
    { id: 'spk_1', name: '嘉宾A', color: '#10b981' },
    { id: 'spk_2', name: '嘉宾B', color: '#f59e0b' },
  ]

  const segments1 = generateMockTranscript(audioFiles[0].id, audioFiles[0].duration, speakers)
  const segments2 = generateMockTranscript(audioFiles[1].id, audioFiles[1].duration, speakers)

  return {
    audioFiles,
    speakers,
    segments: [...segments1, ...segments2],
    markers: [],
    clips: [],
  }
}
