// lib/queries/dinner.ts
import { supabase } from '@/lib/supabase';
import { mockDinner, type DinnerPlan } from '@/lib/mock/dinner';

export type { DinnerPlan };

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatScheduled(raw: string | null | undefined): string {
  if (!raw) return mockDinner.scheduledTime;
  const parts = raw.split(':');
  if (parts.length < 2) return raw;
  let h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mStr = String(m).padStart(2, '0');
  return `${h}:${mStr} ${suffix}`;
}

function formatCookTime(minutes: number | null | undefined): string {
  if (!minutes || !Number.isFinite(minutes)) return mockDinner.cookTime;
  return `${Math.round(minutes)} min`;
}

export async function fetchTonightDinner(): Promise<DinnerPlan | null> {
  try {
    const { data, error } = await supabase
      .from('dinner_plan')
      .select('id, scheduled_time, scheduled_date, recipe_id, recipes(id, name, cook_time_min, image_url)')
      .eq('scheduled_date', todayIso())
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return mockDinner;

    // Supabase nests related record under the relation name
    const recipe = Array.isArray((data as any).recipes)
      ? (data as any).recipes[0]
      : (data as any).recipes;

    if (!recipe) return mockDinner;

    return {
      id: String((data as any).id),
      recipeId: String(recipe.id ?? (data as any).recipe_id ?? mockDinner.recipeId),
      recipeName: recipe.name || mockDinner.recipeName,
      cookTime: formatCookTime(recipe.cook_time_min),
      imageUrl: recipe.image_url || mockDinner.imageUrl,
      scheduledTime: formatScheduled((data as any).scheduled_time),
    };
  } catch (err) {
    console.warn('[queries/dinner] falling back to mock:', err);
    return mockDinner;
  }
}
