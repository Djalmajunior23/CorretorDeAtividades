
export interface RubricCriteria {
  [key: string]: number;
}

export interface RubricConfig {
  id?: string;
  title: string;
  criteria: RubricCriteria;
}

export class RubricService {
  /**
   * Valida se a soma das rubricas é 100.
   */
  static validateRubric(criteria: RubricCriteria): { valid: boolean; total: number; error?: string } {
    const total = Object.values(criteria).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      return { 
        valid: false, 
        total, 
        error: `A soma dos pesos deve ser exatamente 100%. Soma atual: ${total}%` 
      };
    }
    return { valid: true, total };
  }

  /**
   * Retorna rubricas padrão sugeridas.
   */
  static getDefaultRubrics(): RubricConfig[] {
    return [
      {
        title: "Padrão Full-Stack",
        criteria: {
          "Lógica de Programação": 40,
          "Estrutura do Código": 20,
          "Legibilidade": 15,
          "Modularização": 15,
          "Tratamento de Erros": 10
        }
      },
      {
        title: "Clean Code & Docs",
        criteria: {
          "Lógica": 30,
          "Boas Práticas": 25,
          "Documentação": 20,
          "Organização": 15,
          "Nomenclatura": 10
        }
      }
    ];
  }
}
