import type { Meal } from '../types';
  
  // Dieta de EXEMPLO (dados ficticios). A dieta real nao fica neste repositorio publico.
  export const makeMeals = (variant: 'A' | 'B'): Meal[] => {
    const isB = variant === 'B';
    return [
      {
        id: 'cafe', time: '08:00', label: 'Cafe da manha', icon: '\u{1F373}',
        color: 'suppColor', kcal: isB ? 350 : 400, macros: { p: 25, c: 40, g: 15 },
        items: [
          { name: 'Ovos mexidos', detail: '3 unidades', kcal: 240, tip: 'Exemplo.', subs: [] },
        ],
      },
    ];
  };
  
  export const calcTotals = (all: Meal[]) => {
    const meals = all.filter(m => !m.isAlternative);
    return {
      kcal: meals.reduce((s, m) => s + m.kcal, 0),
      p: meals.reduce((s, m) => s + m.macros.p, 0),
      c: meals.reduce((s, m) => s + m.macros.c, 0),
      g: meals.reduce((s, m) => s + m.macros.g, 0),
    };
  };
  