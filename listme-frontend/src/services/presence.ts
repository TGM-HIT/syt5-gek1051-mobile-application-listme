import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePresenceStore = defineStore('presence', () => {
  // listId → Set of online deviceIds
  const onlineByList = ref<Record<string, Set<string>>>({})

  function setSnapshot(listId: string, devices: string[]) {
    onlineByList.value[listId] = new Set(devices)
  }

  function addDevice(listId: string, deviceId: string) {
    if (!onlineByList.value[listId]) onlineByList.value[listId] = new Set()
    onlineByList.value[listId]!.add(deviceId)
  }

  function removeDevice(listId: string, deviceId: string) {
    onlineByList.value[listId]?.delete(deviceId)
  }

  function getCount(listId: string): number {
    return onlineByList.value[listId]?.size ?? 0
  }

  function isOnline(listId: string, deviceId: string): boolean {
    return onlineByList.value[listId]?.has(deviceId) ?? false
  }

  return { onlineByList, setSnapshot, addDevice, removeDevice, getCount, isOnline }
})
