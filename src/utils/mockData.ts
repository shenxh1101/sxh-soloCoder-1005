import { v4 as uuidv4 } from 'uuid'
import type { TranscriptSegment, Speaker } from '@/types'

const mockTexts = [
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
]

export function generateMockTranscript(
  audioFileId: string,
  duration: number,
  speakers: Speaker[]
): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  const avgSegmentDuration = 15
  const numSegments = Math.max(10, Math.floor(duration / avgSegmentDuration))
  let currentTime = 0

  for (let i = 0; i < numSegments; i++) {
    const segmentDuration = Math.min(avgSegmentDuration + Math.random() * 10 - 5, duration - currentTime - 1)
    const speakerIndex = Math.floor(Math.random() * speakers.length)
    const textIndex = i % mockTexts.length

    segments.push({
      id: uuidv4(),
      audioFileId,
      startTime: currentTime,
      endTime: currentTime + segmentDuration,
      text: mockTexts[textIndex],
      speaker: speakers[speakerIndex].id,
      confidence: 0.8 + Math.random() * 0.2,
      annotations: [],
      isDeleted: false,
      isHighlight: Math.random() > 0.85,
      isAd: Math.random() > 0.9,
    })

    currentTime += segmentDuration
    if (currentTime >= duration - 1) break
  }

  return segments
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
