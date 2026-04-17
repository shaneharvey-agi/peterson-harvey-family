import { PHOTO_SHANE, PHOTO_MOLLY, PHOTO_EVEY, PHOTO_JAX } from './photos'
import type { FamilyMember, HomeEvent, HomeRequest, FamilyId } from './home-types'

const DINNER_IMAGE = 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80'
const DINNER_THUMB = 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=100&q=70'

export const FAMILY: Record<FamilyId, FamilyMember> = {
  shane: {
    id: 'shane',
    name: 'Shane',
    color: '#4A90E2',
    borderColor: 'rgba(74,144,226,.55)',
    photo: PHOTO_SHANE,
    online: true,
    unread: 0,
  },
  molly: {
    id: 'molly',
    name: 'Molly',
    color: '#B57BFF',
    borderColor: 'rgba(181,123,255,.6)',
    photo: PHOTO_MOLLY,
    online: true,
    unread: 1,
  },
  evey: {
    id: 'evey',
    name: 'Evey',
    color: '#FF6B9D',
    borderColor: 'rgba(255,107,157,.55)',
    photo: PHOTO_EVEY,
    online: false,
    unread: 0,
  },
  jax: {
    id: 'jax',
    name: 'Jax',
    color: '#4CAF7D',
    borderColor: 'rgba(76,175,125,.55)',
    photo: PHOTO_JAX,
    online: false,
    unread: 0,
  },
}

export const TODAY_EVENTS: HomeEvent[] = [
  {
    id: 'e1',
    title: 'SmartBuild client call',
    timeLabel: '9:00 – 10:00 AM',
    location: 'Zoom',
    owner: 'shane',
  },
  {
    id: 'e2',
    title: 'Lunch with Molly',
    timeLabel: '12:30 – 1:30 PM',
    location: 'Cantina Mexicana',
    owner: 'molly',
  },
  {
    id: 'e3',
    title: 'Boujie NW guest review',
    timeLabel: '3:00 – 4:00 PM',
    owner: 'shane',
  },
  {
    id: 'e4',
    title: 'Chicken Tikka Masala',
    timeLabel: '6:00 PM',
    owner: 'shane',
    kind: 'dinner',
    dinner: {
      recipe: 'Chicken Tikka Masala',
      prep: '20 min prep',
      cook: '35 min cook',
      servings: 4,
      missing: ['heavy cream', 'garam masala'],
      heroImage: DINNER_IMAGE,
      thumbImage: DINNER_THUMB,
    },
  },
  {
    id: 'e5',
    title: 'Jax soccer practice',
    timeLabel: '6:30 – 8:00 PM',
    location: 'Creswell Park',
    owner: 'jax',
  },
]

export const REQUESTS: HomeRequest[] = [
  {
    id: 'r1',
    from: 'molly',
    title: 'Handle dinner tonight',
    detail: 'I have a late meeting until 7 — can you cook or order something for the kids?',
    urgent: true,
    ageLabel: '2 min ago',
    aiReplyTemplate: 'Ordered Chipotle for 6:30pm. Molly notified \u2713',
  },
]

export const PENDING_REQUEST_COUNT = 3

export const WEATHER_CURRENT = { icon: '\u2600\uFE0F', temp: 54 }

export const WEATHER_FORECAST: Array<{ label: string; icon: string; high: number; low: number; today?: boolean }> = [
  { label: 'Today', icon: '\u2600\uFE0F', high: 54, low: 38, today: true },
  { label: 'Thu', icon: '\u26C5', high: 58, low: 41 },
  { label: 'Fri', icon: '\u{1F327}\uFE0F', high: 49, low: 37 },
  { label: 'Sat', icon: '\u{1F327}\uFE0F', high: 46, low: 35 },
  { label: 'Sun', icon: '\u26C5', high: 52, low: 39 },
]

export const MESSAGES_PEEK = {
  unreadCount: 2,
  brief: {
    title: 'Mikayla \u00B7 Morning Brief',
    preview: '"Four things today, one conflict I\u2019ve already handled..."',
    time: '6:01 AM',
  },
  latestDm: {
    from: 'molly' as FamilyId,
    preview: 'Can you handle dinner tonight? Late meeting...',
    time: '2m',
    unread: true,
  },
}

export const DATE_LABEL = 'Wed, April 16'

export const MONTH_EVENTS: Record<number, string[]> = {
  15: ['#4A90E2', '#B57BFF', '#4A90E2', '#4CAF7D'],
  16: ['#FF6B9D', '#4A90E2', '#B57BFF'],
  17: ['#4A90E2', '#4A90E2'],
  18: ['#4CAF7D', '#FF6B9D'],
}

export const MONTH_TODAY = 16
export const MONTH_LABEL = 'April 2026'
