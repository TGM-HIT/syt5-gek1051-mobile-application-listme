import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryService } from '../services/category'
import type { Category, CreateCategoryRequest } from '../types'

export const useCategoriesStore = defineStore('categories', () => {
  // categories keyed by listId
  const categoriesByList = ref<Record<string, Category[]>>({})

  async function fetchForList(listId: string): Promise<void> {
    try {
      categoriesByList.value[listId] = await categoryService.getAll(listId)
    } catch {
      // non-critical — silently ignore
    }
  }

  function getForList(listId: string): Category[] {
    return categoriesByList.value[listId] ?? []
  }

  async function create(listId: string, req: CreateCategoryRequest): Promise<Category> {
    const category = await categoryService.create(listId, req)
    if (!categoriesByList.value[listId]) categoriesByList.value[listId] = []
    categoriesByList.value[listId].push(category)
    return category
  }

  async function remove(listId: string, categoryId: string): Promise<void> {
    await categoryService.delete(listId, categoryId)
    if (categoriesByList.value[listId]) {
      categoriesByList.value[listId] = categoriesByList.value[listId].filter(c => c.id !== categoryId)
    }
  }

  return { categoriesByList, fetchForList, getForList, create, remove }
})
