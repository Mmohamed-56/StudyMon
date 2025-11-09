export const TYPE_CHART = {
    fire: { fire: 0.5, water: 0.5, grass: 2, electric: 1, psychic: 1, ice: 2, dragon: 0.5, dark: 1, fairy: 1, steel: 2, rock: 0.5, ghost: 1 },
    water: { fire: 2, water: 0.5, grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5, dark: 1, fairy: 1, steel: 1, rock: 2, ghost: 1 },
    grass: { fire: 0.5, water: 2, grass: 0.5, electric: 1, psychic: 1, ice: 1, dragon: 0.5, dark: 1, fairy: 1, steel: 0.5, rock: 2, ghost: 1 },
    electric: { fire: 1, water: 2, grass: 0.5, electric: 0.5, psychic: 1, ice: 1, dragon: 0.5, dark: 1, fairy: 1, steel: 1, rock: 1, ghost: 1 },
    psychic: { fire: 1, water: 1, grass: 1, electric: 1, psychic: 0.5, ice: 1, dragon: 1, dark: 0, fairy: 1, steel: 0.5, rock: 1, ghost: 1 },
    ice: { fire: 0.5, water: 0.5, grass: 2, electric: 1, psychic: 1, ice: 0.5, dragon: 2, dark: 1, fairy: 1, steel: 0.5, rock: 1, ghost: 1 },
    dragon: { fire: 1, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 2, dark: 1, fairy: 0, steel: 0.5, rock: 1, ghost: 1 },
    dark: { fire: 1, water: 1, grass: 1, electric: 1, psychic: 2, ice: 1, dragon: 1, dark: 0.5, fairy: 0.5, steel: 1, rock: 1, ghost: 2 },
    fairy: { fire: 0.5, water: 1, grass: 1, electric: 1, psychic: 1, ice: 1, dragon: 2, dark: 2, fairy: 1, steel: 0.5, rock: 1, ghost: 1 },
    steel: { fire: 0.5, water: 0.5, grass: 1, electric: 0.5, psychic: 1, ice: 2, dragon: 1, dark: 1, fairy: 2, steel: 0.5, rock: 2, ghost: 1 },
    rock: { fire: 2, water: 1, grass: 1, electric: 1, psychic: 1, ice: 2, dragon: 1, dark: 1, fairy: 1, steel: 0.5, rock: 1, ghost: 1 },
    ghost: { fire: 1, water: 1, grass: 1, electric: 1, psychic: 2, ice: 1, dragon: 1, dark: 0.5, fairy: 1, steel: 1, rock: 1, ghost: 2 }
  }
  
  export const getTypeEffectiveness = (attackerType, defenderType) => {
    return TYPE_CHART[attackerType]?.[defenderType] || 1
  }