// lib/mock/dinner.ts
export interface DinnerPlan {
  id: string;
  recipeId: string;
  recipeName: string;
  cookTime: string;    // "35 min"
  imageUrl: string;
  scheduledTime: string; // "6:30 PM"
}

export const mockDinner: DinnerPlan = {
  id: 'mock-dinner-1',
  recipeId: 'mock-recipe-1',
  recipeName: 'Sheet-Pan Honey Garlic Chicken',
  cookTime: '35 min',
  imageUrl:
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=70',
  scheduledTime: '6:30 PM',
};
