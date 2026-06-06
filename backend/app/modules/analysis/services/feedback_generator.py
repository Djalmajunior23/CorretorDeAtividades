class FeedbackGenerator:
    @staticmethod
    def generate(syntax_res: dict, structure_res: dict, logic_res: dict, complex_res: dict, quality_res: dict) -> dict:
        summary = "Análise concluída."
        strengths = []
        improvements = []
        concepts_to_review = []
        next_steps = []
        
        # Syntax
        if not syntax_res.get("syntax_ok"):
            summary = "Seu código apresenta erros de sintaxe que impedem a execução."
            concepts_to_review.append("Sintaxe básica")
        else:
            summary = "Seu código está sintaticamente correto."
        
        # Structure
        if structure_res.get("modularity_score", 0) > 5:
            strengths.append("Boa modularização do código usando funções/classes.")
        elif structure_res.get("functions", 0) == 0:
            improvements.append("Tente modularizar seu código utilizando funções.")
            next_steps.append("Aprender e praticar criação de funções.")
            
        if structure_res.get("conditionals", 0) > 0:
            strengths.append("Uso de estruturas condicionais detectado.")
            
        # Logic
        logic_issues = logic_res.get("logic_issues", [])
        if logic_issues:
            improvements.extend(logic_issues)
            concepts_to_review.append("Lógica estruturada")
            
        # Complexity
        level = complex_res.get("complexity_level", "BAIXA")
        if level == "ALTA":
            improvements.append("O código está complexo devido a muitos laços aninhados.")
            concepts_to_review.append("Complexidade de algoritmos")
            next_steps.append("Praticar a simplificação de loops e estruturas condicionais.")
            
        # Quality
        quality_issues = quality_res.get("issues", [])
        for issue in quality_issues:
            improvements.append(issue)
            
        if quality_res.get("quality_score", 100) > 90:
            strengths.append("O código está legível e bem escrito.")
            
        return {
            "summary": summary,
            "strengths": strengths,
            "improvements": improvements,
            "concepts_to_review": list(set(concepts_to_review)),
            "next_steps": list(set(next_steps))
        }
