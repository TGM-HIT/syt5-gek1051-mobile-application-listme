export type VectorClockMap = Record<string, number>

export type OperationType =
  | 'ITEM_CREATE'
  | 'ITEM_UPDATE'
  | 'ITEM_CHECK'
  | 'ITEM_DELETE'
  | 'LIST_UPDATE'

export interface CrdtOperation {
  id: string            // UUID, client-generated
  listId: string
  deviceId: string
  operationType: OperationType
  payload: Record<string, unknown>
  vectorClock: VectorClockMap
  createdAt: number     // epoch ms
}

export type ClockRelation = 'BEFORE' | 'AFTER' | 'CONCURRENT' | 'EQUAL'
