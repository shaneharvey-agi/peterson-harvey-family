export type FamilyId = 'shane' | 'molly' | 'evey' | 'jax'

export type FamilyMember = {
  id: FamilyId
  name: string
  color: string
  borderColor: string
  photo: string
  online: boolean
  unread: number
}

export type HomeEvent = {
  id: string
  title: string
  timeLabel: string
  location?: string
  owner: FamilyId
  kind?: 'event' | 'dinner'
  dinner?: {
    recipe: string
    prep: string
    cook: string
    servings: number
    missing: string[]
    heroImage: string
    thumbImage: string
  }
}

export type HomeRequest = {
  id: string
  from: FamilyId
  title: string
  detail: string
  urgent: boolean
  ageLabel: string
  aiReplyTemplate: string
}

export type CalView = 'day' | 'week' | 'month'

export type NavTab = 'home' | 'todo' | 'kitchen' | 'collabs'

export type MState = 'idle' | 'listening' | 'speaking'
