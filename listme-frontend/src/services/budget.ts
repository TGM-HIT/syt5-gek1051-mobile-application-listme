import api from './api'
import type { BudgetSummary } from '../types'

export const budgetService = {
  get(listId: string): Promise<BudgetSummary> {
    return api.get<BudgetSummary>(`/lists/${listId}/budget`).then(r => r.data)
  },
}
