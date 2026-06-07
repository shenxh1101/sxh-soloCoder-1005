import type { TranscriptSegment, Clip, ExportOptions, Marker, ClipCollection, Speaker, AudioFile } from '@/types'
import { formatTime, formatSRTTime, formatVTTTime } from './time'

export interface ClipValidationIssue {
  type: 'missing-segment' | 'invalid-time' | 'deleted-segment'
  message: string
  severity: 'warning' | 'error'
}

export interface ClipWithValidation extends Clip {
  validationIssues: ClipValidationIssue[]
  segmentTexts: string[]
  speakerNames: string[]
  audioFileName: string
}

export interface ClipGroup {
  key: string
  label: string
  clips: ClipWithValidation[]
  totalDuration: number
  count: number
}

export function validateClip(
  clip: Clip,
  segments: TranscriptSegment[],
  audioFiles: AudioFile[]
): ClipValidationIssue[] {
  const issues: ClipValidationIssue[] = []

  const clipSegments = segments.filter((s) => clip.segmentIds.includes(s.id))
  const missingSegments = clip.segmentIds.filter(
    (id) => !segments.some((s) => s.id === id)
  )

  if (missingSegments.length > 0) {
    issues.push({
      type: 'missing-segment',
      message: `引用的 ${missingSegments.length} 个段落不存在`,
      severity: 'error',
    })
  }

  const deletedSegments = clipSegments.filter((s) => s.isDeleted)
  if (deletedSegments.length > 0) {
    issues.push({
      type: 'deleted-segment',
      message: `包含 ${deletedSegments.length} 个已标记删除的段落`,
      severity: 'warning',
    })
  }

  if (clip.endTime <= clip.startTime) {
    issues.push({
      type: 'invalid-time',
      message: `结束时间必须大于开始时间`,
      severity: 'error',
    })
  }

  if (clip.startTime < 0) {
    issues.push({
      type: 'invalid-time',
      message: `开始时间不能为负数`,
      severity: 'error',
    })
  }

  if (clipSegments.length > 0) {
    const minSegmentTime = Math.min(...clipSegments.map((s) => s.startTime))
    const maxSegmentTime = Math.max(...clipSegments.map((s) => s.endTime))

    if (clip.startTime > minSegmentTime + 0.1) {
      issues.push({
        type: 'invalid-time',
        message: `开始时间早于最早段落的开始时间`,
        severity: 'warning',
      })
    }

    if (clip.endTime < maxSegmentTime - 0.1) {
      issues.push({
        type: 'invalid-time',
        message: `结束时间晚于最晚段落的结束时间`,
        severity: 'warning',
      })
    }
  }

  const audioFile = audioFiles.find((f) => f.id === clip.audioFileId)
  if (audioFile && clip.endTime > audioFile.duration) {
    issues.push({
      type: 'invalid-time',
      message: `结束时间超出音频时长`,
      severity: 'error',
    })
  }

  return issues
}

export function getClipWithValidation(
  clip: Clip,
  segments: TranscriptSegment[],
  speakers: Speaker[],
  audioFiles: AudioFile[]
): ClipWithValidation {
  const clipSegments = segments.filter((s) => clip.segmentIds.includes(s.id))
  const speakerMap = new Map(speakers.map((s) => [s.id, s.name]))
  const audioFile = audioFiles.find((f) => f.id === clip.audioFileId)

  return {
    ...clip,
    validationIssues: validateClip(clip, segments, audioFiles),
    segmentTexts: clipSegments.map((s) => s.text),
    speakerNames: clipSegments.map((s) => speakerMap.get(s.speaker) || s.speaker),
    audioFileName: audioFile?.name || '未知音频',
  }
}

export function groupClips(
  clips: Clip[],
  segments: TranscriptSegment[],
  speakers: Speaker[],
  audioFiles: AudioFile[],
  collections: ClipCollection[],
  groupBy: 'category' | 'tag' | 'collection'
): ClipGroup[] {
  const clipsWithValidation = clips.map((c) =>
    getClipWithValidation(c, segments, speakers, audioFiles)
  )

  const groups: ClipGroup[] = []

  if (groupBy === 'category') {
    const categories = [
      { key: 'golden', label: '金句收藏' },
      { key: 'to-delete', label: '待删片段' },
      { key: 'ad', label: '广告口播' },
      { key: 'custom', label: '自定义' },
    ]

    categories.forEach((cat) => {
      const groupClips = clipsWithValidation.filter((c) => c.category === cat.key)
      if (groupClips.length > 0) {
        groups.push({
          key: cat.key,
          label: cat.label,
          clips: groupClips,
          count: groupClips.length,
          totalDuration: groupClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0),
        })
      }
    })
  } else if (groupBy === 'tag') {
    const allTags = new Set<string>()
    clips.forEach((c) => c.tags.forEach((t) => allTags.add(t)))
    const tagsArray = Array.from(allTags).sort()
    const untaggedClips = clipsWithValidation.filter((c) => c.tags.length === 0)

    tagsArray.forEach((tag) => {
      const groupClips = clipsWithValidation.filter((c) => c.tags.includes(tag))
      if (groupClips.length > 0) {
        groups.push({
          key: tag,
          label: tag,
          clips: groupClips,
          count: groupClips.length,
          totalDuration: groupClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0),
        })
      }
    })

    if (untaggedClips.length > 0) {
      groups.push({
        key: 'untagged',
        label: '无标签',
        clips: untaggedClips,
        count: untaggedClips.length,
        totalDuration: untaggedClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0),
      })
    }
  } else if (groupBy === 'collection') {
    const clipsWithoutCollection = clipsWithValidation.filter((c) => !c.collectionId)

    collections.forEach((col) => {
      const groupClips = clipsWithValidation.filter((c) => c.collectionId === col.id)
      if (groupClips.length > 0) {
        groups.push({
          key: col.id,
          label: col.title,
          clips: groupClips,
          count: groupClips.length,
          totalDuration: groupClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0),
        })
      }
    })

    if (clipsWithoutCollection.length > 0) {
      groups.push({
        key: 'uncollected',
        label: '未分类',
        clips: clipsWithoutCollection,
        count: clipsWithoutCollection.length,
        totalDuration: clipsWithoutCollection.reduce((sum, c) => sum + (c.endTime - c.startTime), 0),
      })
    }
  }

  return groups
}

export function generateTranscript(
  segments: TranscriptSegment[],
  speakers: { id: string; name: string }[],
  options: ExportOptions
): string {
  const filteredSegments = segments
    .filter((s) => options.includeDeletedSegments || !s.isDeleted)
    .sort((a, b) => a.startTime - b.startTime)

  const speakerMap = new Map(speakers.map((s) => [s.id, s.name]))

  let transcript = ''

  if (options.includeHeader) {
    transcript += '='.repeat(60) + '\n'
    transcript += '播客访谈文稿\n'
    transcript += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`
    transcript += `总时长: ${formatTime(segments[segments.length - 1]?.endTime || 0)}\n`
    transcript += '='.repeat(60) + '\n\n'
  }

  filteredSegments.forEach((segment, index) => {
    const speakerName = speakerMap.get(segment.speaker) || segment.speaker

    if (options.includeSpeakerNames) {
      transcript += `[${speakerName}] `
    }

    if (options.includeTimecodes) {
      transcript += `(${formatTime(segment.startTime)}-${formatTime(segment.endTime)}) `
    }

    transcript += segment.text

    if (segment.isHighlight) {
      transcript += ' ⭐'
    }
    if (segment.isAd) {
      transcript += ' [广告]'
    }
    if (segment.isDeleted) {
      transcript += ' [待删除]'
    }

    transcript += '\n'

    if (options.includeAnnotations && segment.annotations.length > 0) {
      segment.annotations.forEach((annotation) => {
        const typeLabels = {
          comment: '注释',
          noise: '噪音',
          important: '重要',
          todo: '待办',
        }
        transcript += `  [${typeLabels[annotation.type]}]: ${annotation.content}\n`
      })
    }

    if (index < filteredSegments.length - 1) {
      transcript += '\n'
    }
  })

  return transcript
}

export function generateSRT(segments: TranscriptSegment[]): string {
  const filteredSegments = segments
    .filter((s) => !s.isDeleted)
    .sort((a, b) => a.startTime - b.startTime)

  let srt = ''

  filteredSegments.forEach((segment, index) => {
    srt += `${index + 1}\n`
    srt += `${formatSRTTime(segment.startTime)} --> ${formatSRTTime(segment.endTime)}\n`
    srt += `${segment.text}\n\n`
  })

  return srt
}

export function generateVTT(segments: TranscriptSegment[]): string {
  const filteredSegments = segments
    .filter((s) => !s.isDeleted)
    .sort((a, b) => a.startTime - b.startTime)

  let vtt = 'WEBVTT\n\n'

  filteredSegments.forEach((segment, index) => {
    vtt += `${index + 1}\n`
    vtt += `${formatVTTTime(segment.startTime)} --> ${formatVTTTime(segment.endTime)}\n`
    vtt += `${segment.text}\n\n`
  })

  return vtt
}

export function generateClipList(
  clips: Clip[],
  segments: TranscriptSegment[],
  collections: ClipCollection[],
  groupBy: 'category' | 'tag' | 'collection' = 'category',
  speakers?: Speaker[],
  audioFiles?: AudioFile[]
): string {
  let list = ''

  const groupLabels = {
    category: '分类',
    tag: '标签',
    collection: '合集',
  }

  const clipsWithValidation = speakers && audioFiles
    ? clips.map((c) => getClipWithValidation(c, segments, speakers, audioFiles))
    : clips.map((c) => ({ ...c, validationIssues: [] as ClipValidationIssue[] }))

  list += '='.repeat(60) + '\n'
  list += '片段清单\n'
  list += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`
  list += `分组方式: 按${groupLabels[groupBy]}\n`

  const totalClips = clips.length
  const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
  const clipsWithErrors = clipsWithValidation.filter(
    (c) => c.validationIssues?.some((i) => i.severity === 'error')
  ).length
  const clipsWithWarnings = clipsWithValidation.filter(
    (c) => c.validationIssues?.some((i) => i.severity === 'warning')
  ).length

  list += `总片段数: ${totalClips} | 总时长: ${formatTime(totalDuration)}\n`
  if (clipsWithErrors > 0 || clipsWithWarnings > 0) {
    list += `异常提示: ${clipsWithErrors} 个错误, ${clipsWithWarnings} 个警告\n`
  }
  list += '='.repeat(60) + '\n\n'

  const formatClipEntry = (clip: Clip & { validationIssues?: ClipValidationIssue[] }, index: number) => {
    const clipSegments = segments.filter((s) => clip.segmentIds.includes(s.id))
    const clipText = clipSegments.map((s) => s.text).join(' ')

    let entry = ''
    const issues = clip.validationIssues || []
    const hasError = issues.some((i) => i.severity === 'error')
    const hasWarning = issues.some((i) => i.severity === 'warning')

    const statusPrefix = hasError ? '❌ ' : hasWarning ? '⚠️  ' : ''

    entry += `${index + 1}. ${statusPrefix}${clip.title}\n`
    entry += `   时间: ${formatTime(clip.startTime)} - ${formatTime(clip.endTime)} `
    entry += `(时长: ${formatTime(clip.endTime - clip.startTime)})\n`
    if (clip.description) {
      entry += `   描述: ${clip.description}\n`
    }
    if (clip.tags.length > 0) {
      entry += `   标签: ${clip.tags.join(', ')}\n`
    }

    if (issues.length > 0) {
      entry += `   异常: ${issues.map((i) => `[${i.severity === 'error' ? '错误' : '警告'}] ${i.message}`).join('; ')}\n`
    }

    entry += `   内容: ${clipText.slice(0, 100)}${clipText.length > 100 ? '...' : ''}\n\n`
    return entry
  }

  if (groupBy === 'category') {
    const categories = [
      { key: 'golden', label: '金句收藏' },
      { key: 'to-delete', label: '待删片段' },
      { key: 'ad', label: '广告口播' },
      { key: 'custom', label: '自定义' },
    ]

    categories.forEach((category) => {
      const categoryClips = clipsWithValidation.filter((c) => c.category === category.key)
      if (categoryClips.length === 0) return

      const groupDuration = categoryClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
      list += `## ${category.label} (${categoryClips.length}个, 总时长: ${formatTime(groupDuration)})\n\n`

      categoryClips.forEach((clip, index) => {
        list += formatClipEntry(clip, index)
      })
    })
  } else if (groupBy === 'tag') {
    const allTags = new Set<string>()
    clips.forEach((c) => c.tags.forEach((t) => allTags.add(t)))
    const tagsArray = Array.from(allTags).sort()
    const untaggedClips = clipsWithValidation.filter((c) => c.tags.length === 0)

    tagsArray.forEach((tag) => {
      const tagClips = clipsWithValidation.filter((c) => c.tags.includes(tag))
      if (tagClips.length === 0) return

      const groupDuration = tagClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
      list += `## ${tag} (${tagClips.length}个, 总时长: ${formatTime(groupDuration)})\n\n`

      tagClips.forEach((clip, index) => {
        list += formatClipEntry(clip, index)
      })
    })

    if (untaggedClips.length > 0) {
      const groupDuration = untaggedClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
      list += `## 无标签 (${untaggedClips.length}个, 总时长: ${formatTime(groupDuration)})\n\n`

      untaggedClips.forEach((clip, index) => {
        list += formatClipEntry(clip, index)
      })
    }
  } else if (groupBy === 'collection') {
    const clipsWithoutCollection = clipsWithValidation.filter((c) => !c.collectionId)

    collections.forEach((collection) => {
      const collectionClips = clipsWithValidation.filter((c) => c.collectionId === collection.id)
      if (collectionClips.length === 0) return

      const groupDuration = collectionClips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
      list += `## ${collection.title} (${collectionClips.length}个, 总时长: ${formatTime(groupDuration)})\n\n`

      collectionClips.forEach((clip, index) => {
        list += formatClipEntry(clip, index)
      })
    })

    if (clipsWithoutCollection.length > 0) {
      const groupDuration = clipsWithoutCollection.reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
      list += `## 未分类 (${clipsWithoutCollection.length}个, 总时长: ${formatTime(groupDuration)})\n\n`

      clipsWithoutCollection.forEach((clip, index) => {
        list += formatClipEntry(clip, index)
      })
    }
  }

  return list
}

export function generateEditSuggestions(
  segments: TranscriptSegment[],
  markers: Marker[],
  clips: Clip[]
): string {
  let suggestions = ''

  suggestions += '='.repeat(60) + '\n'
  suggestions += '剪辑建议\n'
  suggestions += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`
  suggestions += '='.repeat(60) + '\n\n'

  const deletedSegments = segments.filter((s) => s.isDeleted)
  if (deletedSegments.length > 0) {
    suggestions += `### 1. 待删除内容 (${deletedSegments.length}段)\n\n`
    suggestions += `以下片段已标记为待删除，建议在最终剪辑时移除：\n\n`
    deletedSegments.forEach((seg, idx) => {
      suggestions += `${idx + 1}. ${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}\n`
      suggestions += `   ${seg.text.slice(0, 80)}...\n\n`
    })
  }

  const adSegments = segments.filter((s) => s.isAd)
  if (adSegments.length > 0) {
    suggestions += `### 2. 广告口播 (${adSegments.length}段)\n\n`
    suggestions += `以下片段包含广告内容：\n\n`
    adSegments.forEach((seg, idx) => {
      suggestions += `${idx + 1}. ${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}\n`
      suggestions += `   ${seg.text.slice(0, 80)}...\n\n`
    })
  }

  const highlightSegments = segments.filter((s) => s.isHighlight)
  if (highlightSegments.length > 0) {
    suggestions += `### 3. 精彩片段 (${highlightSegments.length}段)\n\n`
    suggestions += `以下片段内容精彩，建议在剪辑时重点保留或用作宣传素材：\n\n`
    highlightSegments.forEach((seg, idx) => {
      suggestions += `${idx + 1}. ${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}\n`
      suggestions += `   ${seg.text.slice(0, 100)}...\n\n`
    })
  }

  const noiseMarkers = markers.filter((m) => m.type === 'noise')
  if (noiseMarkers.length > 0) {
    suggestions += `### 4. 噪音标记 (${noiseMarkers.length}处)\n\n`
    suggestions += `以下位置存在噪音，建议进行音频修复：\n\n`
    noiseMarkers.forEach((marker, idx) => {
      suggestions += `${idx + 1}. ${formatTime(marker.time)} - ${marker.label}\n`
    })
    suggestions += '\n'
  }

  const goldenClips = clips.filter((c) => c.category === 'golden')
  if (goldenClips.length > 0) {
    suggestions += `### 5. 金句合集 (${goldenClips.length}个)\n\n`
    suggestions += `以下金句片段可用于短视频剪辑或社交媒体推广：\n\n`
    goldenClips.forEach((clip, idx) => {
      suggestions += `${idx + 1}. ${clip.title}\n`
      suggestions += `   ${formatTime(clip.startTime)} - ${formatTime(clip.endTime)}\n`
      if (clip.description) {
        suggestions += `   ${clip.description}\n`
      }
      suggestions += '\n'
    })
  }

  suggestions += `### 6. 统计摘要\n\n`
  const totalDuration = segments[segments.length - 1]?.endTime || 0
  const deletedDuration = deletedSegments.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)
  const remainingDuration = totalDuration - deletedDuration

  suggestions += `- 原始时长: ${formatTime(totalDuration)}\n`
  suggestions += `- 删除内容: ${formatTime(deletedDuration)} (${((deletedDuration / totalDuration) * 100).toFixed(1)}%)\n`
  suggestions += `- 预计最终时长: ${formatTime(remainingDuration)}\n`
  suggestions += `- 说话人数: ${new Set(segments.map((s) => s.speaker)).size}\n`
  suggestions += `- 分段数: ${segments.length}\n`
  suggestions += `- 标记数: ${markers.length}\n`
  suggestions += `- 片段数: ${clips.length}\n`

  return suggestions
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
