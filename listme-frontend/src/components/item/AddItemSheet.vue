<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-ctp-crust/60 backdrop-blur-sm" @click="close" />

        <!-- Sheet -->
        <div class="relative bg-ctp-mantle rounded-t-2xl px-4 pt-3 pb-8 safe-bottom shadow-2xl">
          <!-- Handle -->
          <div class="w-10 h-1 bg-ctp-surface1 rounded-full mx-auto mb-4" />

          <h3 class="text-base font-semibold text-ctp-text mb-3">
            {{ editingItem ? 'Item bearbeiten' : 'Item hinzufügen' }}
          </h3>

          <!-- Favorites chips -->
          <div v-if="!editingItem && favorites.length > 0 && !name" class="mb-3">
            <p class="text-[10px] text-ctp-overlay0 mb-1.5 uppercase tracking-wide">Zuletzt</p>
            <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                v-for="fav in favorites"
                :key="fav.id"
                type="button"
                @click="fillFromFavorite(fav)"
                class="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-ctp-surface0 text-ctp-subtext1 text-xs hover:bg-ctp-surface1 transition-colors"
              >
                <span v-if="fav.emoji">{{ fav.emoji }}</span>
                {{ fav.itemName }}
              </button>
            </div>
          </div>

          <!-- Smart suggestions (AI, shown when typing) -->
          <Transition name="suggestions">
            <div v-if="!editingItem && suggestions.length > 0 && name.length > 0" class="mb-3">
              <p class="text-[10px] text-ctp-overlay0 mb-1.5 uppercase tracking-wide">Vorschläge</p>
              <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  v-for="s in suggestions"
                  :key="s.name"
                  type="button"
                  @click="fillFromSuggestion(s)"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ctp-teal/10 text-ctp-teal text-xs font-medium hover:bg-ctp-teal/20 transition-colors"
                >
                  <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {{ s.name }}
                  <span v-if="s.quantityUnit" class="opacity-60">· {{ s.quantityUnit }}</span>
                  <span v-if="s.price" class="opacity-60">· €{{ s.price }}</span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- Name input row (with barcode + voice buttons) -->
          <div class="flex items-center gap-2 mb-3">
            <div class="relative flex-1">
              <input
                ref="inputRef"
                v-model="name"
                type="text"
                placeholder="z.B. Milch, Brot, Äpfel..."
                maxlength="500"
                @keydown.enter="submit"
                @keydown.escape="close"
                class="w-full bg-ctp-surface0 border border-ctp-surface1 rounded-xl px-4 py-3 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-teal transition-colors"
              />
            </div>

            <!-- Voice input -->
            <VoiceInput
              v-if="!editingItem"
              @result="onVoiceResult"
            />

            <!-- Barcode scanner -->
            <button
              v-if="!editingItem"
              type="button"
              @click="showScanner = true"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1 hover:text-ctp-text transition-colors"
              title="Barcode scannen"
              aria-label="Barcode scannen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h2M3 10h2M3 15h2M3 20h2M7 5v15M11 5v15M17 5h2M17 10h2M17 15h2M17 20h2M15 5v15" />
              </svg>
            </button>
          </div>

          <!-- Quantity row -->
          <div class="flex items-center gap-2 mb-3">
            <input
              v-model.number="quantity"
              type="number"
              min="0"
              step="any"
              placeholder="Menge"
              class="w-24 bg-ctp-surface0 border border-ctp-surface1 rounded-xl px-3 py-2 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-teal transition-colors"
            />
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="unit in UNITS"
                :key="unit"
                type="button"
                @click="quantityUnit = quantityUnit === unit ? '' : unit"
                class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                :class="quantityUnit === unit
                  ? 'bg-ctp-teal text-ctp-base'
                  : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'"
              >
                {{ unit }}
              </button>
            </div>
          </div>

          <!-- Price row -->
          <div class="flex items-center gap-2 mb-3">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ctp-overlay1">€</span>
              <input
                v-model.number="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-28 bg-ctp-surface0 border border-ctp-surface1 rounded-xl pl-7 pr-3 py-2 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-teal transition-colors"
              />
            </div>
            <span class="text-xs text-ctp-overlay0">Preis gesamt</span>
          </div>

          <!-- Image picker -->
          <div class="mb-4">
            <p class="text-[10px] text-ctp-overlay0 mb-1.5 uppercase tracking-wide">Bild</p>
            <ImagePicker v-model="imageUrl" />
          </div>

          <!-- Category -->
          <div class="mb-4">
            <p class="text-[10px] text-ctp-overlay0 mb-1.5 uppercase tracking-wide">Kategorie</p>
            <CategoryPicker
              :categories="listCategories"
              :selected-id="selectedCategoryId"
              @update:selected-id="selectedCategoryId = $event"
              @create="(name) => categoriesStore.create(props.listId, { name })"
            />
          </div>

          <!-- Labels -->
          <div v-if="listLabels.length > 0" class="mb-4">
            <p class="text-[10px] text-ctp-overlay0 mb-1.5 uppercase tracking-wide">Labels</p>
            <LabelPicker :labels="listLabels" v-model:selectedIds="selectedLabelIds" />
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="close"
              class="flex-1 py-3 rounded-xl bg-ctp-surface0 text-ctp-subtext0 text-sm font-medium hover:bg-ctp-surface1 transition-colors"
            >
              Abbrechen
            </button>
            <button
              @click="submit"
              :disabled="!name.trim()"
              class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              :class="name.trim()
                ? 'bg-ctp-teal text-ctp-base hover:brightness-110 active:scale-95'
                : 'bg-ctp-surface1 text-ctp-overlay0 cursor-not-allowed'"
            >
              {{ editingItem ? 'Speichern' : 'Hinzufügen' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Barcode scanner (full-screen) -->
  <BarcodeScannerModal v-model="showScanner" @scanned="onBarcodeScanned" />
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Item, Favorite } from '../../types'
import { favoriteService } from '../../services/favorite'
import { useLabelsStore } from '../../stores/labels'
import { useCategoriesStore } from '../../stores/categories'
import { searchHistory, type HistorySuggestion } from '../../services/itemHistory'
import LabelPicker from './LabelPicker.vue'
import CategoryPicker from './CategoryPicker.vue'
import ImagePicker from './ImagePicker.vue'
import VoiceInput from './VoiceInput.vue'
import BarcodeScannerModal, { type ScannedProduct } from './BarcodeScannerModal.vue'

const UNITS = ['Stk.', 'kg', 'g', 'L', 'ml']

const props = defineProps<{
  modelValue: boolean
  editingItem?: Item | null
  listId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: { name: string; quantity: number | null; quantityUnit: string | null; labelIds: string[]; categoryId: string | null; price: number | null; imageUrl: string | null }]
}>()

const labelsStore = useLabelsStore()
const categoriesStore = useCategoriesStore()
const listLabels = computed(() => labelsStore.getForList(props.listId))
const listCategories = computed(() => categoriesStore.getForList(props.listId))

const name = ref('')
const quantity = ref<number | ''>('')
const quantityUnit = ref('')
const price = ref<number | ''>('')
const imageUrl = ref<string | null>(null)
const selectedLabelIds = ref<string[]>([])
const selectedCategoryId = ref<string | null>(null)
const favorites = ref<Favorite[]>([])
const inputRef = ref<HTMLInputElement | null>(null)
const showScanner = ref(false)

// ── Smart suggestions — backed by item history API (Phase 12) ─────────────────
const suggestions = ref<HistorySuggestion[]>([])

watch(name, async (val) => {
  if (!val || val.trim().length < 2) { suggestions.value = []; return }
  suggestions.value = await searchHistory(val.trim(), 5)
})

function fillFromSuggestion(s: HistorySuggestion) {
  name.value = s.name
  if (s.quantityUnit) quantityUnit.value = s.quantityUnit
  if (s.price !== null) price.value = s.price
  if (s.imageUrl) imageUrl.value = s.imageUrl
  nextTick(() => inputRef.value?.focus())
}
// ─────────────────────────────────────────────────────────────────────────────

watch(() => props.modelValue, async (open) => {
  if (open) {
    name.value = props.editingItem?.name ?? ''
    quantity.value = props.editingItem?.quantity ?? ''
    quantityUnit.value = props.editingItem?.quantityUnit ?? ''
    price.value = props.editingItem?.price ?? ''
    imageUrl.value = props.editingItem?.imageUrl ?? null
    selectedLabelIds.value = props.editingItem?.labels?.map(l => l.id) ?? []
    selectedCategoryId.value = props.editingItem?.categoryId ?? null
    nextTick(() => inputRef.value?.focus())

    if (!props.editingItem) {
      favoriteService.getAll().then(f => { favorites.value = f }).catch(() => {})
    }
    labelsStore.fetchForList(props.listId)
    categoriesStore.fetchForList(props.listId)
  }
})

function fillFromFavorite(fav: Favorite) {
  name.value = fav.itemName
  nextTick(() => inputRef.value?.focus())
}

function onBarcodeScanned(product: ScannedProduct) {
  name.value = product.name
  if (product.quantity !== null) quantity.value = product.quantity
  if (product.quantityUnit) {
    quantityUnit.value = UNITS.find(u => u === product.quantityUnit) ?? product.quantityUnit
  }
  if (product.imageUrl) imageUrl.value = product.imageUrl
  nextTick(() => inputRef.value?.focus())
}

// Maps spoken German unit words → canonical UNITS values
const UNIT_MAP: Record<string, string> = {
  kg: 'kg', kilo: 'kg', kilogramm: 'kg',
  g: 'g', gramm: 'g',
  l: 'L', liter: 'L',
  ml: 'ml', milliliter: 'ml',
  stk: 'Stk.', stück: 'Stk.', stücke: 'Stk.', stuck: 'Stk.',
}
// Escape for use in regex alternation
const UNIT_PAT = Object.keys(UNIT_MAP).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

// German number words → digits (speech recognition sometimes returns words)
const NUM_WORDS: Record<string, number> = {
  null: 0, ein: 1, eine: 1, einer: 1, einem: 1, einen: 1,
  zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6,
  sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12,
}
function toDigits(text: string): string {
  const pat = new RegExp(`\\b(${Object.keys(NUM_WORDS).join('|')})\\b`, 'gi')
  return text.replace(pat, m => String(NUM_WORDS[m.toLowerCase()] ?? m))
}

function parseVoice(raw: string): { name: string; qty: number | null; unit: string | null; price: number | null } {
  // Convert number words first so "zwei" → "2" before pattern matching
  let text = toDigits(raw.trim())

  // 1. Extract price: "1,99 Euro", "15 €", "für 3 Euro"
  // Use (?!\w) instead of \b because € is not a word character
  let price: number | null = null
  const priceMatch = text.match(/(?:für\s+)?(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)(?!\w)/i)
  if (priceMatch) {
    price = parseFloat(priceMatch[1]!.replace(',', '.'))
    text = text.replace(priceMatch[0], '').trim().replace(/\s{2,}/g, ' ')
  }

  let qty: number | null = null
  let unit: string | null = null
  let itemName = text

  // 2. "[qty] [unit] [name]" — "2 kg Mehl"
  const p1 = text.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${UNIT_PAT})\\.?\\s+(.+)$`, 'i'))
  if (p1) {
    qty = parseFloat(p1[1]!.replace(',', '.'))
    unit = UNIT_MAP[p1[2]!.toLowerCase()] ?? p1[2]!
    itemName = p1[3]!.trim()
  } else {
    // 3. "[name] [qty] [unit]" — "Maiswaffeln 2 Stück"
    const p2 = text.match(new RegExp(`^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*(${UNIT_PAT})\\.?$`, 'i'))
    if (p2) {
      itemName = p2[1]!.trim()
      qty = parseFloat(p2[2]!.replace(',', '.'))
      unit = UNIT_MAP[p2[3]!.toLowerCase()] ?? p2[3]!
    } else {
      // 4. "[name] [qty]" — "Äpfel 3"
      const p3 = text.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)$/)
      if (p3) {
        itemName = p3[1]!.trim()
        qty = parseFloat(p3[2]!.replace(',', '.'))
      }
    }
  }

  return { name: itemName, qty, unit, price }
}

function onVoiceResult(transcript: string) {
  const parsed = parseVoice(transcript)
  name.value = parsed.name
  if (parsed.qty !== null) quantity.value = parsed.qty
  if (parsed.unit) {
    quantityUnit.value = UNITS.find(u => u === parsed.unit) ?? parsed.unit
  }
  if (parsed.price !== null) price.value = parsed.price
  nextTick(() => inputRef.value?.focus())
}

function submit() {
  if (!name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    quantity: quantity.value === '' ? null : quantity.value,
    quantityUnit: quantityUnit.value || null,
    price: price.value === '' ? null : price.value,
    imageUrl: imageUrl.value,
    labelIds: selectedLabelIds.value,
    categoryId: selectedCategoryId.value,
  })
  close()
}

function close() {
  name.value = ''
  quantity.value = ''
  quantityUnit.value = ''
  price.value = ''
  imageUrl.value = null
  selectedLabelIds.value = []
  selectedCategoryId.value = null
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from .relative,
.sheet-leave-to .relative {
  transform: translateY(100%);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.suggestions-enter-active { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
.suggestions-leave-active { transition: all 0.15s ease; }
.suggestions-enter-from { opacity: 0; transform: translateY(-6px); }
.suggestions-leave-to { opacity: 0; }
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
