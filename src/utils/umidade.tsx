// YESSSSS
type Planta = 'Feijão Preto' | 'Feijão Cores' |'Arroz' | 'Mandioca' | 'Milho' | 'Cafe' | 'Trigo' | 'Banana' | 'Abacaxi';
type Estagio = 'Germinacao' | 'Vegetativo' | 'Florescimento' | 'Maturacao';
type Solo = 'Arenoso' | 'Argiloso' | 'Silte';

// Mapa de referência de umidade por planta e estágio (valores % de capacidade de campo)
const UMIDADES: Record<Planta, Record<Estagio, number>> = {
  'Feijão Preto': {
    Germinacao: 75,
    Vegetativo: 65,
    Florescimento: 75,
    Maturacao: 60,
  },
  'Feijão Cores': {
    Germinacao: 75,
    Vegetativo: 65,
    Florescimento: 75,
    Maturacao: 60,
  },
  Arroz: {
    Germinacao: 95,
    Vegetativo: 95,
    Florescimento: 95,
    Maturacao: 75,
  },
  Mandioca: {
    Germinacao: 70,
    Vegetativo: 65,
    Florescimento: 65,
    Maturacao: 60,
  },
  Milho: {
    Germinacao: 75,
    Vegetativo: 70,
    Florescimento: 80,
    Maturacao: 65,
  },
  Cafe: {
    Germinacao: 75,
    Vegetativo: 70,
    Florescimento: 75,
    Maturacao: 65,
  },
  Trigo: {
    Germinacao: 75,
    Vegetativo: 70,
    Florescimento: 80,
    Maturacao: 65,
  },
  Banana: {
    Germinacao: 80,
    Vegetativo: 75,
    Florescimento: 80,
    Maturacao: 75,
  },
  Abacaxi: {
    Germinacao: 70,
    Vegetativo: 65,
    Florescimento: 70,
    Maturacao: 65,
  }
};

// Modificador de solo (quanto o solo retém ou perde água)
const SOLO_MOD: Record<Solo, number> = {
  Arenoso: -10, // perde água rápido → diminuir %
  Silte: 0,     // neutro
  Argiloso: +5, // retém água → pode aumentar %
};

/**
 * Calcula a umidade ideal considerando planta, estágio e tipo de solo
 */
export function calcularUmidadeIdeal(
  planta: Planta,
  estagio: Estagio,
  solo: Solo
): number {
  const base = UMIDADES[planta][estagio];
  const mod = SOLO_MOD[solo] || 0;
  const resultado = base + mod;

  // Garantir que o valor fique entre 0 e 100%
  return Math.min(100, Math.max(0, resultado));
}
