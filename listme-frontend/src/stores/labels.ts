import { defineStore } from 'pinia'
import { ref } from 'vue'
import { labelService } from '../services/label'
import type { Label, CreateLabelRequest } from '../types'

export const useLabelsStore = defineStore('labels', () => {
  // labels keyed by listId
  const labelsByList = ref<Record<string, Label[]>>({})

  async function fetchForList(listId: string): Promise<void> {
    try {
      labelsByList.value[listId] = await labelService.getAll(listId)
    } catch {
      // non-critical — silently ignore
    }
  }

  function getForList(listId: string): Label[] {
    return labelsByList.value[listId] ?? []
  }

  async function create(listId: string, req: CreateLabelRequest): Promise<Label> {
    const label = await labelService.create(listId, req)
    if (!labelsByList.value[listId]) labelsByList.value[listId] = []
    labelsByList.value[listId].push(label)
    return label
  }

  async function remove(listId: string, labelId: string): Promise<void> {
    await labelService.delete(listId, labelId)
    if (labelsByList.value[listId]) {
      labelsByList.value[listId] = labelsByList.value[listId].filter(l => l.id !== labelId)
    }
  }

  return { labelsByList, fetchForList, getForList, create, remove }
})
