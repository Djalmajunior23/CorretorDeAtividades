export interface Rubric {
  syntax_weight: number;
  tests_weight: number;
  quality_weight: number;
  security_weight?: number;
}

export interface GraderResult {
  syntax_score: number;
  test_score: number;
  quality_score: number;
  security_score: number;
  final_score: number;
}

export class Grader {
  // Default classical rubric
  private static DEFAULT_RUBRIC: Rubric = {
    syntax_weight: 30,
    tests_weight: 50,
    quality_weight: 20,
    security_weight: 0
  };

  /**
   * Calculates detailed scoring based on provided or default rubrics.
   */
  static grade(
    syntaxOk: boolean,
    testScorePercentage: number, // 0 to 100
    qualityScoreRaw: number, // 0 to 20
    isSecurityOk: boolean,
    customRubric?: Rubric
  ): GraderResult {
    // If security is violated, score is immediately 0!
    if (!isSecurityOk) {
      return {
        syntax_score: 0,
        test_score: 0,
        quality_score: 0,
        security_score: 0,
        final_score: 0
      };
    }

    const r = customRubric || this.DEFAULT_RUBRIC;
    const syntaxWeight = r.syntax_weight ?? 30;
    const testsWeight = r.tests_weight ?? 50;
    const qualityWeight = r.quality_weight ?? 20;
    const securityWeight = r.security_weight ?? 0;

    // Syntax score: either max weight or 0 depending on syntaxOk
    const syntax_score = syntaxOk ? syntaxWeight : 0;

    // Test score: proportion of passed tests (earned weight relative to percentage)
    const test_score = Math.round((testScorePercentage / 100) * testsWeight);

    // Quality score: qualityScoreRaw is up to 20, so normalize to the quality weight
    const quality_score = Math.round((qualityScoreRaw / 20) * qualityWeight);

    // Security score: full weight if ok
    const security_score = securityWeight;

    // Final score sum
    const final_score = Math.min(100, Math.max(0, syntax_score + test_score + quality_score + security_score));

    return {
      syntax_score,
      test_score,
      quality_score,
      security_score,
      final_score
    };
  }
}
