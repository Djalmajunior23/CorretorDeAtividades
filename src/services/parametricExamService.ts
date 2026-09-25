import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { safeAutoTable, getAutoTableFinalY } from "../utils/pdfExport";

export type ExamVariantLetter = "A" | "B" | "C" | "D";

export interface ExamTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
}

export interface RubricCriterion {
  id: string;
  criterion: string;
  weight: number; // e.g. 25 (%)
  description: string;
}

export interface MultipleChoiceOption {
  letter: "A" | "B" | "C" | "D";
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  questionNumber: number;
  language: string; // e.g. "python", "javascript", "typescript", "java", "csharp", "cpp", "php", "go", "rust", "sql", "html_css"
  topic: string;
  difficulty: "facil" | "medio" | "dificil";
  bloomTaxonomy: "Lembrar" | "Entender" | "Aplicar" | "Analisar" | "Avaliar" | "Criar";
  enunciado: string;
  codeSnippet?: string;
  options: MultipleChoiceOption[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface ParametricVariant {
  variantId: ExamVariantLetter;
  title: string;
  domainScenario: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: string;
  expectedSolutionCode: string;
  testCases: ExamTestCase[];
  rubric: RubricCriterion[];
  antiPlagiarismChecksum: string;
  variableDictionary: Record<string, string | number>;
  questions: MultipleChoiceQuestion[];
  questionCount: number;
  targetLanguages?: string[];
  answerKeyMap: Record<number, "A" | "B" | "C" | "D">;
}

export interface StudentAssignment {
  studentId: string;
  studentName: string;
  enrollmentCode?: string;
  classId?: string;
  className?: string;
  assignedVariant: ExamVariantLetter;
  seatNumber?: number;
  uniqueExamToken: string;
}

export interface StudentIndividualBooklet {
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  enrollmentCode?: string;
  assignedVariant: ExamVariantLetter;
  seatNumber?: number;
  examId: string;
  examTitle: string;
  courseName: string;
  subject: string;
  durationMinutes: number;
  uniqueExamToken: string;
  questions: MultipleChoiceQuestion[];
  answerKeyMap: Record<number, "A" | "B" | "C" | "D">;
  generatedAt: string;
}

export interface ParametricExamMaster {
  examId: string;
  examTitle: string;
  courseName: string;
  subject: string;
  durationMinutes: number;
  basePrompt: string;
  language: string;
  selectedLanguages: string[];
  questionCount: number;
  examType: "multiple_choice" | "mixed" | "practical_code";
  totalVariants: number;
  variants: ParametricVariant[];
  studentAssignments: StudentAssignment[];
  studentBooklets: StudentIndividualBooklet[];
  createdAt: string;
}

// =============================================================================
// MULTI-LANGUAGE QUESTION REPOSITORY (4 OPTIONS A, B, C, D)
// =============================================================================
const MULTI_LANG_QUESTION_BANK: Array<Omit<MultipleChoiceQuestion, "id" | "questionNumber">> = [
  // 1. PYTHON
  {
    language: "python",
    topic: "Estruturas de Dados & List Comprehension",
    difficulty: "medio",
    bloomTaxonomy: "Analisar",
    enunciado: "Considere o seguinte trecho em Python 3 que realiza processamento e filtragem de uma lista de dados. Qual será a saída final exibida no console?",
    codeSnippet: `numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
resultado = [x**2 for x in numeros if x % 2 == 0 and x > 4]
print(resultado)`,
    options: [
      { letter: "A", text: "[36, 64, 100]", isCorrect: true, explanation: "Os números pares maiores que 4 são 6, 8 e 10. Elevados ao quadrado: 36, 64 e 100." },
      { letter: "B", text: "[16, 36, 64, 100]", isCorrect: false, explanation: "O número 4 não entra porque a condição exige x > 4 (estritamente maior)." },
      { letter: "C", text: "[6, 8, 10]", isCorrect: false, explanation: "Faltou aplicar a expressão x**2 que eleva cada item ao quadrado." },
      { letter: "D", text: "[25, 49, 81]", isCorrect: false, explanation: "Esses são os quadrados dos ímpares maiores que 4, mas o código filtra x % 2 == 0." }
    ],
    correctOption: "A",
    explanation: "A list comprehension filtra apenas os valores pares maiores que 4 (6, 8, 10) e calcula seus quadrados: 6²=36, 8²=64, 10²=100."
  },
  {
    language: "python",
    topic: "Dicionários, Mutabilidade & Métodos Nativos",
    difficulty: "facil",
    bloomTaxonomy: "Entender",
    enunciado: "Em Python, qual método é o mais seguro para obter o valor associado a uma chave em um dicionário sem lançar uma exceção KeyError caso a chave não exista?",
    codeSnippet: `config = {"porta": 8080, "host": "localhost"}
# Como obter o valor de "timeout" de forma segura com valor padrão 30?`,
    options: [
      { letter: "A", text: "config.get(\"timeout\", 30)", isCorrect: true, explanation: "O método dict.get() retorna o valor padrão se a chave não existir, sem lançar KeyError." },
      { letter: "B", text: "config[\"timeout\"] || 30", isCorrect: false, explanation: "Sintaxe inválida em Python; colchetes com chave ausente lançam KeyError." },
      { letter: "C", text: "config.fetch(\"timeout\", default=30)", isCorrect: false, explanation: "Não existe método fetch() no tipo primitivo dict em Python." },
      { letter: "D", text: "config.find(\"timeout\")", isCorrect: false, explanation: "O método find() pertence a strings, não a dicionários." }
    ],
    correctOption: "A",
    explanation: "O método get(chave, default) é a forma canônica e segura de consultar chaves em dicionários Python."
  },
  {
    language: "python",
    topic: "Gerenciadores de Contexto & Arquivos (with)",
    difficulty: "medio",
    bloomTaxonomy: "Aplicar",
    enunciado: "Ao manipular arquivos em Python, por que a declaração `with open(...)` é considerada uma boa prática fundamental?",
    codeSnippet: `with open("dados_senai.csv", "r", encoding="utf-8") as arq:
    conteudo = arq.read()`,
    options: [
      { letter: "A", text: "Garante o fechamento automático do arquivo (método __exit__), mesmo se ocorrerem exceções durante a leitura.", isCorrect: true, explanation: "Garante que o descritor de arquivo seja fechado no sistema operacional mesmo em caso de erro." },
      { letter: "B", text: "Aumenta a velocidade de leitura em disco carregando o arquivo diretamente na memória da GPU.", isCorrect: false, explanation: "Gerenciadores de contexto não usam GPU para I/O básico de disco." },
      { letter: "C", text: "Converte automaticamente o formato CSV para objetos JSON em tempo de execução.", isCorrect: false, explanation: "with open() apenas gerencia o stream de arquivo, sem parsing automático de formatos." },
      { letter: "D", text: "Torna o arquivo imutável e impede escrita concorrente por outros processos do SO.", isCorrect: false, explanation: "with open não aplica lock exclusivo no sistema operacional por padrão." }
    ],
    correctOption: "A",
    explanation: "A instrução 'with' implementa o Context Manager Protocol (__enter__ e __exit__), assegurando liberação de recursos."
  },

  // 2. JAVASCRIPT
  {
    language: "javascript",
    topic: "Event Loop, Microtasks & Assincronismo",
    difficulty: "dificil",
    bloomTaxonomy: "Analisar",
    enunciado: "Analise a ordem de execução do Event Loop do JavaScript (V8 Engine) no código abaixo. Qual será a sequência exata de números impressos no console?",
    codeSnippet: `console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);`,
    options: [
      { letter: "A", text: "1, 4, 3, 2", isCorrect: true, explanation: "Código síncrono executa primeiro (1, 4), seguido pela fila de Microtasks (Promise: 3) e pela Macrotask (setTimeout: 2)." },
      { letter: "B", text: "1, 2, 3, 4", isCorrect: false, explanation: "setTimeout e Promise são assíncronos e não executam inline com a call stack." },
      { letter: "C", text: "1, 4, 2, 3", isCorrect: false, explanation: "Microtasks (Promises) têm prioridade absoluta sobre Macrotasks (setTimeout)." },
      { letter: "D", text: "1, 3, 4, 2", isCorrect: false, explanation: "O console.log(4) está na call stack síncrona, executando antes do microtask callback." }
    ],
    correctOption: "A",
    explanation: "Na especificação do Event Loop: Código Síncrono (1, 4) -> Fila de Microtasks (3) -> Fila de Tarefas/Macrotasks (2)."
  },
  {
    language: "javascript",
    topic: "Escopo, Closures & Imutabilidade",
    difficulty: "medio",
    bloomTaxonomy: "Aplicar",
    enunciado: "O que a função `criarContador` retornará na segunda chamada de `contadorB()` no código a seguir?",
    codeSnippet: `function criarContador() {
  let contagem = 0;
  return () => ++contagem;
}
const contadorA = criarContador();
const contadorB = criarContador();
contadorA(); // chamada 1
contadorA(); // chamada 2
console.log(contadorB()); // chamada 1
console.log(contadorB()); // chamada 2?`,
    options: [
      { letter: "A", text: "2", isCorrect: true, explanation: "Cada invocação de criarContador gera um novo escopo léxico isolado. contadorB foi chamado duas vezes (retorna 1, depois 2)." },
      { letter: "B", text: "4", isCorrect: false, explanation: "contadorA e contadorB não compartilham a mesma variável 'contagem'." },
      { letter: "C", text: "1", isCorrect: false, explanation: "Essa foi a primeira chamada de contadorB; a segunda chamada incrementa e retorna 2." },
      { letter: "D", text: "undefined", isCorrect: false, explanation: "A closure mantém a referência ativa e incrementa a variável normalmente." }
    ],
    correctOption: "A",
    explanation: "Closures capturam o ambiente léxico no momento da instanciação. Cada instância possui sua própria variável 'contagem'."
  },

  // 3. TYPESCRIPT
  {
    language: "typescript",
    topic: "Generics, Union Types & Type Narrowing",
    difficulty: "medio",
    bloomTaxonomy: "Aplicar",
    enunciado: "No TypeScript 5+, qual recurso de Type Narrowing permite diferenciar com precisão os tipos de uma união discriminada (Discriminated Union)?",
    codeSnippet: `type Sucesso = { status: "success"; dados: string[] };
type Falha = { status: "error"; mensagem: string };
type RespostaApi = Sucesso | Falha;

function tratarResposta(res: RespostaApi) {
  if (res.status === "success") {
    console.log(res.dados.length);
  }
}`,
    options: [
      { letter: "A", text: "Propriedade discriminante literal ('status') com checagem condicional em tempo de compilação.", isCorrect: true, explanation: "A propriedade literal comum 'status' permite que o compilador refine o tipo para 'Sucesso' dentro do bloco if." },
      { letter: "B", text: "Uso obrigatório de casting com o operador 'as any'.", isCorrect: false, explanation: "Casting para 'any' desativa a verificação estática de tipos, o oposto de type safety." },
      { letter: "C", text: "Verificação via operador typeof res.dados !== 'undefined' em runtime.", isCorrect: false, explanation: "TypeScript infere o tipo com base no campo literal discriminante 'status'." },
      { letter: "D", text: "Sobrecarga de decoradores de classe (@Discriminant).", isCorrect: false, explanation: "Não existem decoradores padrão para uniões discriminadas em TS." }
    ],
    correctOption: "A",
    explanation: "União discriminada (Discriminated Union) utiliza uma propriedade literal compartilhada ('status') para refinamento de tipo (Narrowing)."
  },

  // 4. JAVA
  {
    language: "java",
    topic: "Coleções, Polimorfismo & HashMap vs TreeMap",
    difficulty: "medio",
    bloomTaxonomy: "Entender",
    enunciado: "Em Java (JDK 17+), qual a principal diferença arquitetural e de complexidade temporal entre `HashMap` e `TreeMap` para operações de busca `get()` e inserção `put()`?",
    codeSnippet: `Map<String, Aluno> mapa1 = new HashMap<>();
Map<String, Aluno> mapa2 = new TreeMap<>();`,
    options: [
      { letter: "A", text: "HashMap opera em tempo O(1) amortizado baseado em tabela hash, enquanto TreeMap opera em O(log n) mantendo chaves ordenadas via árvore Red-Black.", isCorrect: true, explanation: "HashMap usa hashing O(1) sem ordem; TreeMap usa árvore rubro-negra O(log n) com ordenação natural." },
      { letter: "B", text: "HashMap aceita apenas chaves numéricas, enquanto TreeMap aceita Strings e objetos complexos.", isCorrect: false, explanation: "Ambos aceitam qualquer tipo de objeto que implemente hashCode/equals ou Comparable." },
      { letter: "C", text: "TreeMap é sincronizado e thread-safe nativamente, enquanto HashMap não é.", isCorrect: false, explanation: "Nenhum dos dois é thread-safe (para thread-safety usa-se ConcurrentHashMap)." },
      { letter: "D", text: "HashMap consome mais memória e garante inserção na ordem de chegada (FIFO).", isCorrect: false, explanation: "Ordem de inserção é mantida por LinkedHashMap, não HashMap." }
    ],
    correctOption: "A",
    explanation: "HashMap utiliza buckets de hash garantindo complexidade O(1) em média. O TreeMap usa Red-Black Tree garantindo O(log n) com ordenação de chaves."
  },
  {
    language: "java",
    topic: "Programação Funcional, Streams API & Imutabilidade",
    difficulty: "dificil",
    bloomTaxonomy: "Analisar",
    enunciado: "Qual será o resultado da execução do seguinte pipeline Java Stream?",
    codeSnippet: `List<Integer> numeros = List.of(1, 2, 3, 4, 5, 6);
int resultado = numeros.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * 3)
    .reduce(0, Integer::sum);
System.out.println(resultado);`,
    options: [
      { letter: "A", text: "36", isCorrect: true, explanation: "Pares: 2, 4, 6. Multiplicados por 3: 6, 12, 18. Soma total: 6 + 12 + 18 = 36." },
      { letter: "B", text: "63", isCorrect: false, explanation: "63 seria a soma de todos os itens multiplicados por 3 (1+2+3+4+5+6 = 21 * 3 = 63)." },
      { letter: "C", text: "12", isCorrect: false, explanation: "12 é apenas a soma dos pares originais (2 + 4 + 6 = 12), sem a multiplicação por 3." },
      { letter: "D", text: "18", isCorrect: false, explanation: "18 é apenas o maior elemento transformado (6 * 3)." }
    ],
    correctOption: "A",
    explanation: "Filter seleciona os pares (2, 4, 6), Map multiplica por 3 (6, 12, 18) e Reduce soma todos os elementos resultando em 36."
  },

  // 5. C# (.NET)
  {
    language: "csharp",
    topic: "LINQ & Manipulação Funcional de Dados",
    difficulty: "medio",
    bloomTaxonomy: "Aplicar",
    enunciado: "Qual consulta LINQ em C# retorna corretamente os nomes dos alunos aprovados (nota >= 60.0) em ordem alfabética crescente?",
    codeSnippet: `public record Aluno(string Nome, double Nota);
List<Aluno> turma = ObterAlunosSENAI();`,
    options: [
      { letter: "A", text: "turma.Where(a => a.Nota >= 60.0).OrderBy(a => a.Nome).Select(a => a.Nome).ToList();", isCorrect: true, explanation: "Where filtra nota >= 60, OrderBy ordena por Nome ascendente, e Select projeta apenas o Nome." },
      { letter: "B", text: "turma.Filter(a => a.Nota >= 60.0).SortBy(a => a.Nome).Extract(a => a.Nome);", isCorrect: false, explanation: "Métodos Filter, SortBy e Extract não existem na biblioteca padrão do LINQ em C#." },
      { letter: "C", text: "turma.Select(a => a.Nome).Where(a => a.Nota >= 60.0);", isCorrect: false, explanation: "Fazer Select antes do Where perde acesso à propriedade Nota para filtragem." },
      { letter: "D", text: "from a in turma group a by a.Nota >= 60.0 orderby a.Nome select a.Nome;", isCorrect: false, explanation: "Sintaxe de consulta incompleta e agrupamento incorreto para ordenação." }
    ],
    correctOption: "A",
    explanation: "O encadeamento Where -> OrderBy -> Select é a convenção canônica do LINQ para filtro, ordenação e projeção."
  },

  // 6. C / C++
  {
    language: "cpp",
    topic: "Ponteiros, Aritmética de Ponteiros & Gerenciamento de Memória",
    difficulty: "dificil",
    bloomTaxonomy: "Analisar",
    enunciado: "Em C/C++, qual o valor impresso na saída padrão após a execução do código a seguir?",
    codeSnippet: `#include <stdio.h>

int main() {
    int valores[] = {10, 20, 30, 40, 50};
    int *ptr = valores;
    ptr += 2;
    printf("%d", *(ptr + 1));
    return 0;
}`,
    options: [
      { letter: "A", text: "40", isCorrect: true, explanation: "ptr inicialmente aponta para valores[0] (10). ptr += 2 move para valores[2] (30). *(ptr + 1) acessa valores[3], cujo valor é 40." },
      { letter: "B", text: "30", isCorrect: false, explanation: "30 é o valor em *ptr, mas o código avalia *(ptr + 1)." },
      { letter: "C", text: "50", isCorrect: false, explanation: "50 seria acessado com *(ptr + 2)." },
      { letter: "D", text: "20", isCorrect: false, explanation: "20 é valores[1]." }
    ],
    correctOption: "A",
    explanation: "Aritmética de ponteiros avança o endereço baseado no tamanho do tipo `int`. valores[0+2+1] = valores[3] = 40."
  },

  // 7. SQL
  {
    language: "sql",
    topic: "Agrupamento, Filtros & Cláusula HAVING vs WHERE",
    difficulty: "medio",
    bloomTaxonomy: "Aplicar",
    enunciado: "Em um banco de dados relacional SQL padrão ANSI, qual a diferença essencial entre as cláusulas `WHERE` e `HAVING`?",
    codeSnippet: `SELECT turma_id, AVG(nota) as media_turma
FROM avaliacoes
WHERE status = 'concluida'
GROUP BY turma_id
HAVING AVG(nota) >= 70.0;`,
    options: [
      { letter: "A", text: "WHERE filtra linhas individuais antes do agrupamento; HAVING filtra grupos agregados após o processamento do GROUP BY.", isCorrect: true, explanation: "WHERE não aceita funções de agregação diretamente em linhas individuais, enquanto HAVING opera sobre os resultados agregados." },
      { letter: "B", text: "HAVING é executado antes do FROM, enquanto WHERE é executado no final da query.", isCorrect: false, explanation: "Ordem lógica: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY." },
      { letter: "C", text: "WHERE só funciona em bancos MySQL, enquanto HAVING é exclusivo do PostgreSQL.", isCorrect: false, explanation: "Ambas são palavras-chave do padrão SQL ANSI presentes em todos os RDBMS relacionais." },
      { letter: "D", text: "HAVING é utilizado apenas para ordenar colunas numéricas em ordem decrescente.", isCorrect: false, explanation: "Ordenação é realizada exclusivamente por ORDER BY." }
    ],
    correctOption: "A",
    explanation: "WHERE filtra tuplas individuais antes do GROUP BY; HAVING aplica predicados sobre conjuntos agregados."
  },
  {
    language: "sql",
    topic: "Joins Relacionais & Cardinalidade",
    difficulty: "facil",
    bloomTaxonomy: "Entender",
    enunciado: "Qual tipo de JOIN deve ser utilizado para listar TODOS os alunos cadastrados, mesmo aqueles que ainda não possuem nenhuma nota ou avaliação registrada?",
    codeSnippet: `SELECT a.nome, n.valor_nota
FROM alunos a
______ JOIN notas n ON a.id = n.aluno_id;`,
    options: [
      { letter: "A", text: "LEFT JOIN (ou LEFT OUTER JOIN)", isCorrect: true, explanation: "Preserva todas as linhas da tabela à esquerda ('alunos'), preenchendo com NULL onde não houver correspondência em 'notas'." },
      { letter: "B", text: "INNER JOIN", isCorrect: false, explanation: "INNER JOIN excluiria todos os alunos sem notas correspondentes." },
      { letter: "C", text: "CROSS JOIN com cláusula DISTINCT", isCorrect: false, explanation: "CROSS JOIN gera produto cartesiano sem correspondência de chave primária/estrangeira." },
      { letter: "D", text: "RIGHT JOIN", isCorrect: false, explanation: "RIGHT JOIN preservaria todas as notas, podendo omitir alunos sem notas." }
    ],
    correctOption: "A",
    explanation: "LEFT OUTER JOIN preserva todas as linhas da tabela à esquerda (alunos) independente da existência de dados na tabela à direita (notas)."
  },

  // 8. PHP
  {
    language: "php",
    topic: "Segurança, Injeção SQL & PDO Prepared Statements",
    difficulty: "medio",
    bloomTaxonomy: "Aplicar",
    enunciado: "Em PHP 8+, qual é a abordagem recomendada pela OWASP para evitar ataques de SQL Injection ao autenticar um usuário no banco de dados?",
    codeSnippet: `// Qual trecho implementa Prepared Statements seguros via PDO?`,
    options: [
      { letter: "A", text: "$stmt = $pdo->prepare('SELECT id, senha_hash FROM usuarios WHERE email = :email'); $stmt->execute(['email' => $email]);", isCorrect: true, explanation: "Prepared statements separam o comando SQL dos parâmetros de dados, tornando injeção impossível." },
      { letter: "B", text: "$sql = \"SELECT id FROM usuarios WHERE email = '\" . addslashes($email) . \"'\"; $pdo->query($sql);", isCorrect: false, explanation: "addslashes não protege de forma robusta contra injeções em codificações multi-byte." },
      { letter: "C", text: "$sql = \"SELECT id FROM usuarios WHERE email = '\" . $_POST['email'] . \"'\"; $pdo->exec($sql);", isCorrect: false, explanation: "Concatenação direta de entradas não sanitizadas é vulnerabilidade crítica de SQL Injection." },
      { letter: "D", text: "$pdo->query('SELECT id FROM usuarios WHERE email = ' . md5($email));", isCorrect: false, explanation: "MD5 não é seguro e concatenação ainda é má prática." }
    ],
    correctOption: "A",
    explanation: "Declarações preparadas (Prepared Statements) com bind de parâmetros garantem que a entrada do usuário nunca seja interpretada como código SQL executável."
  },

  // 9. GO (GOLANG)
  {
    language: "go",
    topic: "Concorrência, Goroutines & Channels",
    difficulty: "dificil",
    bloomTaxonomy: "Analisar",
    enunciado: "Em Go, qual a finalidade principal do canal `chan` na comunicação entre diferentes `goroutines`?",
    codeSnippet: `func trabalhador(ch chan int) {
    ch <- 42 // envia valor
}
func main() {
    canal := make(chan int)
    go trabalhador(canal)
    valor := <-canal // recebe valor
}`,
    options: [
      { letter: "A", text: "Permitir a comunicação e sincronização segura de dados entre threads leves sem necessidade de travas de memória explícitas (mutexes).", isCorrect: true, explanation: "Princípio do Go: 'Do not communicate by sharing memory; instead, share memory by communicating'." },
      { letter: "B", text: "Serializar objetos em formato JSON para gravação em disco rígido.", isCorrect: false, explanation: "Canais são primitivas de sincronização e comunicação em memória, não de serialização." },
      { letter: "C", text: "Criar conexões HTTP persistentes com servidores web externos.", isCorrect: false, explanation: "Conexões HTTP são tratadas pelo pacote net/http." },
      { letter: "D", text: "Alocar blocos de memória contígua diretamente na memória Heap.", isCorrect: false, explanation: "Alocação é gerenciada pelo compilador e runtime do Go." }
    ],
    correctOption: "A",
    explanation: "Canais em Go viabilizam concorrência CSP (Communicating Sequential Processes) com sincronização e troca de mensagens seguras."
  },

  // 10. RUST
  {
    language: "rust",
    topic: "Ownership, Borrowing & Segurança de Memória",
    difficulty: "dificil",
    bloomTaxonomy: "Analisar",
    enunciado: "No sistema de Ownership do Rust, o que acontecerá ao tentar compilar o código abaixo?",
    codeSnippet: `fn main() {
    let s1 = String::from("SENAI CodeCheck");
    let s2 = s1;
    println!("Valor: {}", s1);
}`,
    options: [
      { letter: "A", text: "Erro de compilação (borrow of moved value: `s1`), pois a posse da memória no Heap foi transferida (move) para `s2`.", isCorrect: true, explanation: "Ao atribuir s1 a s2, ocorre uma movimentação (move). s1 se torna inválido para evitar double free." },
      { letter: "B", text: "Imprime 'Valor: SENAI CodeCheck' normalmente, pois strings são copiadas por valor.", isCorrect: false, explanation: "String em Rust não implementa a trait Copy; ela gerencia memória no Heap." },
      { letter: "C", text: "Erro em tempo de execução (Segmentation Fault) ao tentar ler ponteiro nulo.", isCorrect: false, explanation: "O compilador do Rust detecta o erro estaticamente em tempo de compilação." },
      { letter: "D", text: "Cria automaticamente uma referência imutável (&s1) compartilhada.", isCorrect: false, explanation: "Atribuição sem '&' realiza move, e não borrowing." }
    ],
    correctOption: "A",
    explanation: "Rust possui modelo de ownership estrito: atribuição de tipos sem a trait Copy move o recurso, invalidando o identificador de origem."
  },

  // 11. HTML / CSS / WEB
  {
    language: "html_css",
    topic: "Flexbox, Grid & Responsividade Moderna",
    difficulty: "facil",
    bloomTaxonomy: "Entender",
    enunciado: "Em CSS3 moderno, qual combinação de propriedades em um container `display: flex` centraliza perfeitamente um elemento filho tanto no eixo horizontal quanto no eixo vertical?",
    codeSnippet: `.container {
    display: flex;
    /* Propriedades de centralização total */
}`,
    options: [
      { letter: "A", text: "justify-content: center; align-items: center;", isCorrect: true, explanation: "justify-content alinha no eixo principal (main axis) e align-items alinha no eixo transversal (cross axis)." },
      { letter: "B", text: "text-align: center; vertical-align: middle;", isCorrect: false, explanation: "Essas propriedades são para elementos inline/tabelas, não para flexbox layout." },
      { letter: "C", text: "flex-direction: center; margin: 0 auto;", isCorrect: false, explanation: "flex-direction não aceita o valor 'center' (apenas row, column, etc.)." },
      { letter: "D", text: "place-self: center; float: center;", isCorrect: false, explanation: "float: center não existe na especificação CSS." }
    ],
    correctOption: "A",
    explanation: "Em Flexbox, justify-content: center centraliza no eixo principal e align-items: center centraliza no eixo cruzado."
  }
];

export class ParametricExamService {
  /**
   * Generates a complete set of anti-cheat parametric exam variants (A, B, C, D)
   * with the exact requested number of 4-option multiple-choice questions across requested programming languages,
   * plus practical algorithmic problem statements, test cases, rubrics, and individual student booklets.
   */
  static async generateParametricExam(params: {
    examTitle?: string;
    courseName?: string;
    subject?: string;
    basePrompt: string;
    language?: string;
    selectedLanguages?: string[];
    questionCount?: number;
    examType?: "multiple_choice" | "mixed" | "practical_code";
    variantCount?: number;
    durationMinutes?: number;
    classId?: string;
    className?: string;
    students?: Array<{ id: string; name: string; enrollmentCode?: string }>;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<ParametricExamMaster> {
    const examId = `pexam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const examTitle = params.examTitle || "Avaliação Paramétrica & Simulado Técnico de Programação";
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const subject = params.subject || "Lógica, Estruturas de Dados & Linguagens de Programação";
    const language = params.language || "typescript";
    const variantCount = Math.min(Math.max(params.variantCount || 4, 2), 4);
    const durationMinutes = params.durationMinutes || 90;
    const requestedCount = Math.min(Math.max(params.questionCount || 10, 1), 50);
    const examType = params.examType || "multiple_choice";

    // Selected programming languages for multi-language tests
    const selectedLanguages = (params.selectedLanguages && params.selectedLanguages.length > 0)
      ? params.selectedLanguages
      : ["python", "javascript", "typescript", "java", "csharp", "sql", "cpp", "go", "php", "rust"];

    const variantLetters: ExamVariantLetter[] = ["A", "B", "C", "D"];
    const targetLetters = variantLetters.slice(0, variantCount);

    // 1. Generate Questions with 4 options (A, B, C, D) per question
    let baseQuestions: MultipleChoiceQuestion[] = [];

    // Attempt AI Generation first if available
    try {
      const prompt = `
Você é o Especialista Chefe em Provas Técnicas e Simulados do SENAI.
Crie um conjunto de EXATAMENTE ${requestedCount} questões de MÚLTIPLA ESCOLHA com QUATRO ALTERNATIVAS (A, B, C, D) sobre linguagens de programação.

Linguagens permitidas: ${selectedLanguages.join(", ")}
Contexto / Foco Pedagógico: "${params.basePrompt || "Fundamentos de programação, POO, estruturas de dados, algoritmos e boas práticas"}"
Nível de Ensino: Técnico e Superior

REQUISITOS OBRIGATÓRIOS PARA CADA QUESTÃO:
1. Ter rigorosamente 4 alternativas identificadas pelas letras "A", "B", "C" e "D".
2. Apenas UMA alternativa correta ("isCorrect": true), e 3 distratores técnicos plausíveis ("isCorrect": false).
3. Conter um enunciado técnico claro e, preferencialmente, um trecho de código (codeSnippet) na linguagem indicada.
4. Conter justificativa didática detalhada ("explanation") explicando o porquê do gabarito e por que os distratores estão incorretos.
5. Indicar a linguagem ("language"), tópico ("topic"), dificuldade ("facil", "medio" ou "dificil") e nível da taxonomia de Bloom ("Lembrar", "Entender", "Aplicar", "Analisar", "Avaliar", "Criar").

Retorne RIGOROSAMENTE apenas um JSON no formato:
{
  "questions": [
    {
      "language": "python",
      "topic": "List Comprehension",
      "difficulty": "medio",
      "bloomTaxonomy": "Analisar",
      "enunciado": "Considere o código a seguir...",
      "codeSnippet": "x = [i for i in range(10) if i % 2 == 0]",
      "options": [
        { "letter": "A", "text": "Texto da alternativa A...", "isCorrect": true, "explanation": "Explicação..." },
        { "letter": "B", "text": "Texto da alternativa B...", "isCorrect": false, "explanation": "Explicação..." },
        { "letter": "C", "text": "Texto da alternativa C...", "isCorrect": false, "explanation": "Explicação..." },
        { "letter": "D", "text": "Texto da alternativa D...", "isCorrect": false, "explanation": "Explicação..." }
      ],
      "correctOption": "A",
      "explanation": "Explicação detalhada do gabarito..."
    }
  ]
}
`;
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 7000 });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          baseQuestions = parsed.questions.slice(0, requestedCount).map((q: any, idx: number) => {
            const opts: MultipleChoiceOption[] = (q.options || []).slice(0, 4).map((opt: any, optIdx: number) => {
              const letter = (["A", "B", "C", "D"][optIdx] || "A") as "A" | "B" | "C" | "D";
              return {
                letter,
                text: String(opt.text || `Opção ${letter}`),
                isCorrect: Boolean(opt.isCorrect),
                explanation: String(opt.explanation || "")
              };
            });

            // Ensure at least one correct option
            if (!opts.some(o => o.isCorrect)) {
              opts[0].isCorrect = true;
            }
            const correctOpt = opts.find(o => o.isCorrect)?.letter || "A";

            return {
              id: `q_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
              questionNumber: idx + 1,
              language: q.language || selectedLanguages[idx % selectedLanguages.length],
              topic: q.topic || "Lógica e Computação",
              difficulty: q.difficulty || "medio",
              bloomTaxonomy: q.bloomTaxonomy || "Aplicar",
              enunciado: q.enunciado || `Questão ${idx + 1} sobre desenvolvimento de software.`,
              codeSnippet: q.codeSnippet || undefined,
              options: opts,
              correctOption: correctOpt,
              explanation: q.explanation || "Gabarito baseado nas regras oficiais da linguagem."
            };
          });
        }
      }
    } catch {
      // Fallback below
    }

    // High Quality deterministic multi-language fallback if AI failed or returned partial
    if (baseQuestions.length < requestedCount) {
      const filteredBank = MULTI_LANG_QUESTION_BANK.filter(q => 
        selectedLanguages.includes(q.language) || selectedLanguages.length === 0
      );
      const sourcePool = filteredBank.length > 0 ? filteredBank : MULTI_LANG_QUESTION_BANK;

      const needed = requestedCount - baseQuestions.length;
      for (let i = 0; i < needed; i++) {
        const template = sourcePool[i % sourcePool.length];
        const qNum = baseQuestions.length + 1;
        
        // Clone and customize question
        const optionsClone: MultipleChoiceOption[] = template.options.map(opt => ({
          ...opt
        }));

        baseQuestions.push({
          id: `q_std_${qNum}_${Math.random().toString(36).substring(2, 6)}`,
          questionNumber: qNum,
          language: template.language,
          topic: template.topic,
          difficulty: template.difficulty,
          bloomTaxonomy: template.bloomTaxonomy,
          enunciado: template.enunciado,
          codeSnippet: template.codeSnippet,
          options: optionsClone,
          correctOption: template.correctOption,
          explanation: template.explanation
        });
      }
    }

    // 2. Build 4 Parametric Variants (A, B, C, D) with Anti-Cheat Shuffling
    const domains = [
      {
        variantId: "A" as ExamVariantLetter,
        title: `${examTitle} - Variante A (E-Commerce & Pagamentos)`,
        domain: "Cálculo de Desconto Progressivo em Carrinho de Compras",
        fnName: "calcularDescontoEcommerce",
        paramName: "valorTotal",
        threshold1: 100,
        rate1: "5%",
        threshold2: 500,
        rate2: "15%"
      },
      {
        variantId: "B" as ExamVariantLetter,
        title: `${examTitle} - Variante B (Fintech & Crédito)`,
        domain: "Tarifação e Cashback em Transações PIX Corporativas",
        fnName: "calcularCashbackTransacao",
        paramName: "valorTransacao",
        threshold1: 150,
        rate1: "4%",
        threshold2: 600,
        rate2: "12%"
      },
      {
        variantId: "C" as ExamVariantLetter,
        title: `${examTitle} - Variante C (Logística & Frete)`,
        domain: "Taxa de Despacho e Desconto por Peso de Carga",
        fnName: "calcularFreteLogistica",
        paramName: "pesoCargaKg",
        threshold1: 120,
        rate1: "6%",
        threshold2: 450,
        rate2: "18%"
      },
      {
        variantId: "D" as ExamVariantLetter,
        title: `${examTitle} - Variante D (Indústria & Produção)`,
        domain: "Bonificação de Rendimento e Eficiência de Lotes",
        fnName: "calcularRendimentoProducao",
        paramName: "unidadesProduzidas",
        threshold1: 200,
        rate1: "8%",
        threshold2: 800,
        rate2: "20%"
      }
    ];

    const variants: ParametricVariant[] = targetLetters.map((letter, letterIdx) => {
      const d = domains[letterIdx];

      // Anti-Cheat: Permute question order or options according to variant letter
      const variantQuestions: MultipleChoiceQuestion[] = baseQuestions.map((bq, qIdx) => {
        // Shift options cyclically for anti-cola (e.g. Variant B shifts by 1, C by 2, D by 3)
        const shift = letterIdx % 4;
        const letters: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
        
        const originalOptions = [...bq.options];
        const shiftedOptions: MultipleChoiceOption[] = [];
        
        for (let i = 0; i < 4; i++) {
          const sourceIdx = (i + shift) % 4;
          const targetLetter = letters[i];
          const opt = originalOptions[sourceIdx];
          shiftedOptions.push({
            letter: targetLetter,
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation
          });
        }

        const newCorrect = shiftedOptions.find(o => o.isCorrect)?.letter || "A";

        return {
          ...bq,
          id: `var_${letter}_q_${qIdx + 1}`,
          questionNumber: qIdx + 1,
          options: shiftedOptions,
          correctOption: newCorrect
        };
      });

      const answerKeyMap: Record<number, "A" | "B" | "C" | "D"> = {};
      variantQuestions.forEach(q => {
        answerKeyMap[q.questionNumber] = q.correctOption;
      });

      return {
        variantId: letter,
        title: d.title,
        domainScenario: d.domain,
        problemStatement: `Você foi contratado para implementar o módulo central de ${d.domain}. Escreva a função \`${d.fnName}(${d.paramName}: number): number\` que recebe um valor numérico positivo e calcula o montante final aplicando as seguintes regras:\n1. Valores até R$ ${d.threshold1}: sem alteração (0% de taxa/desconto).\n2. Valores entre R$ ${d.threshold1 + 1} e R$ ${d.threshold2}: aplica alíquota de ${d.rate1}.\n3. Valores acima de R$ ${d.threshold2}: aplica alíquota de ${d.rate2}.\nRetorne o valor com precisão de 2 casas decimais.`,
        inputFormat: `Número real ou inteiro representando \`${d.paramName}\` (>= 0).`,
        outputFormat: "Número real formatado correspondente ao resultado final.",
        constraints: [
          "Não utilize bibliotecas externas.",
          "Valide se a entrada é negativa e lance um erro 'ValorInválido'.",
          "Complexidade temporal estrita O(1)."
        ],
        starterCode: `/**\n * ${d.title}\n * @param {number} ${d.paramName}\n * @returns {number}\n */\nexport function ${d.fnName}(${d.paramName}: number): number {\n  // TODO: Implemente a lógica da Variante ${letter}\n  throw new Error("Não implementado");\n}`,
        expectedSolutionCode: `export function ${d.fnName}(${d.paramName}: number): number {\n  if (${d.paramName} < 0) throw new Error("ValorInválido");\n  if (${d.paramName} <= ${d.threshold1}) return ${d.paramName};\n  if (${d.paramName} <= ${d.threshold2}) {\n    const factor = ${d.rate1 === "5%" ? "0.05" : d.rate1 === "4%" ? "0.04" : d.rate1 === "6%" ? "0.06" : "0.08"};\n    return Number((${d.paramName} * (1 - factor)).toFixed(2));\n  }\n  const factor = ${d.rate2 === "15%" ? "0.15" : d.rate2 === "12%" ? "0.12" : d.rate2 === "18%" ? "0.18" : "0.20"};\n  return Number((${d.paramName} * (1 - factor)).toFixed(2));\n}`,
        testCases: [
          { id: `${letter}_tc1`, name: "Faixa 1 - Isento", input: `${d.threshold1 / 2}`, expectedOutput: `${d.threshold1 / 2}`, isHidden: false, explanation: "Valor abaixo do primeiro limiar." },
          { id: `${letter}_tc2`, name: "Faixa 2 - Intermediária", input: `${d.threshold1 + 50}`, expectedOutput: `${Number(((d.threshold1 + 50) * (1 - parseFloat(d.rate1) / 100)).toFixed(2))}`, isHidden: false, explanation: "Aplica alíquota da primeira faixa." },
          { id: `${letter}_tc3`, name: "Faixa 3 - Máxima", input: `${d.threshold2 + 200}`, expectedOutput: `${Number(((d.threshold2 + 200) * (1 - parseFloat(d.rate2) / 100)).toFixed(2))}`, isHidden: false, explanation: "Aplica alíquota da segunda faixa." },
          { id: `${letter}_tc4`, name: "Caso de Borda - Zero", input: "0", expectedOutput: "0", isHidden: true, explanation: "Entrada zero deve retornar zero sem erro." }
        ],
        rubric: [
          { id: `${letter}_r1`, criterion: "Estrutura Condicional & Regras de Negócio", weight: 35, description: "Cobriu todas as 3 faixas com operadores relacionais corretos." },
          { id: `${letter}_r2`, criterion: "Precisão Numérica e Arredondamento", weight: 25, description: "Cálculo exato com 2 casas decimais sem dízimas." },
          { id: `${letter}_r3`, criterion: "Tratamento de Casos de Borda e Erros", weight: 20, description: "Validação de valores negativos e zero." },
          { id: `${letter}_r4`, criterion: "Legibilidade & Clean Code", weight: 20, description: "Boas práticas, nomes limpos e sem código duplicado." }
        ],
        antiPlagiarismChecksum: `sig_${letter}_${Math.random().toString(36).substring(2, 9)}`,
        variableDictionary: {
          fnName: d.fnName,
          paramName: d.paramName,
          threshold1: d.threshold1,
          threshold2: d.threshold2,
          rate1: d.rate1,
          rate2: d.rate2
        },
        questions: variantQuestions,
        questionCount: variantQuestions.length,
        targetLanguages: selectedLanguages,
        answerKeyMap
      };
    });

    // 3. Resolve Students and build Individual Booklets
    const studentList = params.students && params.students.length > 0
      ? params.students
      : [
          { id: "std_01", name: "Ana Clara Silva", enrollmentCode: "SENAI-2026-001" },
          { id: "std_02", name: "Bruno Henrique Santos", enrollmentCode: "SENAI-2026-002" },
          { id: "std_03", name: "Carlos Eduardo Souza", enrollmentCode: "SENAI-2026-003" },
          { id: "std_04", name: "Daniela Ferreira Lima", enrollmentCode: "SENAI-2026-004" },
          { id: "std_05", name: "Enzo Gabriel Martins", enrollmentCode: "SENAI-2026-005" },
          { id: "std_06", name: "Fernanda Alves Rocha", enrollmentCode: "SENAI-2026-006" },
          { id: "std_07", name: "Gabriel Monteiro Cruz", enrollmentCode: "SENAI-2026-007" },
          { id: "std_08", name: "Helena Beatriz Barbosa", enrollmentCode: "SENAI-2026-008" }
        ];

    const studentAssignments = this.distributeToStudents(variants, studentList);

    // Build Individual Booklets for each student
    const studentBooklets: StudentIndividualBooklet[] = studentAssignments.map((sa) => {
      const matchedVariant = variants.find(v => v.variantId === sa.assignedVariant) || variants[0];
      return {
        studentId: sa.studentId,
        studentName: sa.studentName,
        classId: params.classId,
        className: params.className || "Turma DS-2026",
        enrollmentCode: sa.enrollmentCode,
        assignedVariant: sa.assignedVariant,
        seatNumber: sa.seatNumber,
        examId,
        examTitle,
        courseName,
        subject,
        durationMinutes,
        uniqueExamToken: sa.uniqueExamToken,
        questions: matchedVariant.questions,
        answerKeyMap: matchedVariant.answerKeyMap,
        generatedAt: new Date().toISOString()
      };
    });

    return {
      examId,
      examTitle,
      courseName,
      subject,
      durationMinutes,
      basePrompt: params.basePrompt,
      language,
      selectedLanguages,
      questionCount: requestedCount,
      examType,
      totalVariants: variants.length,
      variants,
      studentAssignments,
      studentBooklets,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Distributes variants evenly among students so adjacent desks get distinct variants.
   */
  static distributeToStudents(
    variants: ParametricVariant[],
    students: Array<{ id: string; name: string; enrollmentCode?: string }>
  ): StudentAssignment[] {
    const letters = variants.map(v => v.variantId);
    return students.map((student, idx) => {
      const assignedVariant = letters[idx % letters.length];
      const token = `EXAM-${assignedVariant}-${student.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return {
        studentId: student.id,
        studentName: student.name,
        enrollmentCode: student.enrollmentCode || `MAT-${String(idx + 1).padStart(4, "0")}`,
        assignedVariant,
        seatNumber: idx + 1,
        uniqueExamToken: token
      };
    });
  }

  /**
   * Generates a Master PDF dossier strictly adhering to the SENAI Institutional Standard:
   * 1. Official Institutional Cover, Exam Application Protocol & Anti-Cheat Seating Grid
   * 2. Full individual exam papers for each variant (A, B, C, D) with 4-choice multiple choice questions
   * 3. Standardized Optical Student Answer Sheet
   * 4. Master Teacher Answer Key with detailed solution code and explanations.
   */
  static async generateMasterExamPdf(exam: ParametricExamMaster): Promise<Buffer> {
    const doc = new jsPDF();
    const totalVariants = exam.variants.length;

    // =========================================================================
    // PAGE 1: SENAI INSTITUTIONAL COVER & SEATING / APPLICATION PROTOCOL
    // =========================================================================
    doc.setFillColor(0, 51, 153); // SENAI Blue (#003399)
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor(255, 204, 0); // SENAI Yellow Accent
    doc.rect(0, 32, 210, 2.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI / DR", 14, 11);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("DOSSIÊ OFICIAL DE AVALIAÇÃO & SIMULADO PARAMÉTRICO", 14, 21);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`SISTEMA INTEGRADO DE AVALIAÇÕES • ${exam.questionCount} QUESTÕES DE MÚLTIPLA ESCOLHA (4 OPÇÕES A/B/C/D)`, 14, 28);

    // Exam Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 39, 182, 40, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 39, 182, 40, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Avaliação / Simulado: ${exam.examTitle}`, 18, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Curso: ${exam.courseName}`, 18, 52);
    doc.text(`Unidade Curricular / Módulo: ${exam.subject}`, 18, 58);
    doc.text(`Duração Oficial: ${exam.durationMinutes} minutos | Questões: ${exam.questionCount} (4 Alternativas)`, 18, 64);
    doc.text(`Linguagens no Simulado: ${(exam.selectedLanguages || ["Multi-Linguagens"]).join(", ").toUpperCase()}`, 18, 70);
    doc.text(`Variantes Anti-Cola Geradas: ${totalVariants} (A, B, C, D) com gabaritos permutados`, 18, 76);

    // Application Protocol Table
    doc.setTextColor(0, 51, 153);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("1. Mapa de Sala e Alocação dos Estudantes por Variante (Layout Xadrez):", 14, 87);

    const allocationRows = exam.studentAssignments.map(sa => [
      sa.seatNumber ? `Posto #${sa.seatNumber}` : "-",
      sa.studentName,
      sa.enrollmentCode || "-",
      `VARIANTE ${sa.assignedVariant}`,
      sa.uniqueExamToken,
      "[   ] Presente"
    ]);

    safeAutoTable(doc, {
      startY: 91,
      head: [["Posto", "Nome do Estudante", "Matrícula", "Caderno", "Token Único", "Frequência"]],
      body: allocationRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalYProtocol = getAutoTableFinalY(doc, 220);
    
    if (finalYProtocol < 240) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, finalYProtocol + 6, 182, 34, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalYProtocol + 6, 182, 34, 2, 2, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("TERMO DE APLICAÇÃO E ENCERRAMENTO DA AVALIAÇÃO:", 18, finalYProtocol + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Certifico que a aplicação ocorreu em conformidade com as diretrizes do SENAI, sem ocorrências de fraude.", 18, finalYProtocol + 18);
      doc.text("Docente Aplicador: _____________________________________________   Assinatura: ________________________", 18, finalYProtocol + 26);
      doc.text("Horário de Início: ____:____  |  Horário de Término: ____:____  |  Data: ___/___/2026", 18, finalYProtocol + 33);
    }

    // =========================================================================
    // EXAM PAPERS FOR EACH VARIANT (A, B, C, D)
    // =========================================================================
    exam.variants.forEach((variant) => {
      doc.addPage();

      // Top Institutional Header
      doc.setFillColor(0, 51, 153);
      doc.rect(0, 0, 210, 26, "F");
      doc.setFillColor(255, 204, 0);
      doc.rect(0, 26, 210, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text(`SENAI • ${exam.courseName.toUpperCase()}`, 14, 9);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`CADERNO DE QUESTÕES & SIMULADO • [VARIANTE ${variant.variantId}]`, 14, 18);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`DISCIPLINA: ${exam.subject.toUpperCase()} • DURAÇÃO: ${exam.durationMinutes} MIN • TOTAL: ${variant.questions?.length || exam.questionCount} QUESTÕES`, 14, 24);

      // Student Identification Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 31, 182, 20, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 31, 182, 20, 2, 2, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 37);
      doc.text("Data: ___/___/2026   Posto/Carteira: [       ]   Assinatura: _______________________________________", 18, 44);

      let currentY = 56;

      // Render Multiple Choice Questions (4 Options A, B, C, D)
      const questionsToRender = variant.questions && variant.questions.length > 0
        ? variant.questions
        : [];

      questionsToRender.forEach((q, idx) => {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }

        // Question Number & Header
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, currentY, 182, 7, 1, 1, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`QUESTÃO ${q.questionNumber || idx + 1} • [${q.language.toUpperCase()}] ${q.topic}`, 18, currentY + 5);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(`Dificuldade: ${q.difficulty.toUpperCase()} | Bloom: ${q.bloomTaxonomy}`, 145, currentY + 5);

        currentY += 10;

        // Enunciado
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7.5);
        const splitEnunciado = doc.splitTextToSize(q.enunciado, 180);
        doc.text(splitEnunciado, 14, currentY);
        currentY += splitEnunciado.length * 3.8 + 2;

        // Code Snippet (if present)
        if (q.codeSnippet) {
          const splitCode = q.codeSnippet.split("\n");
          const codeBoxHeight = Math.min(splitCode.length * 3.5 + 4, 38);
          
          if (currentY + codeBoxHeight > 275) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFillColor(15, 23, 42); // slate-900
          doc.roundedRect(14, currentY, 182, codeBoxHeight, 1.5, 1.5, "F");
          doc.setTextColor(226, 232, 240); // slate-200
          doc.setFont("courier", "normal");
          doc.setFontSize(6.5);

          splitCode.slice(0, 9).forEach((line, lIdx) => {
            doc.text(line.substring(0, 85), 18, currentY + 4 + lIdx * 3.5);
          });

          doc.setFont("helvetica", "normal");
          currentY += codeBoxHeight + 3;
        }

        // 4 Multiple Choice Options (A, B, C, D)
        q.options.forEach((opt) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }

          doc.setTextColor(15, 23, 42);
          doc.setFontSize(7.2);
          doc.setFont("helvetica", "bold");
          doc.text(`(   )  ${opt.letter})`, 18, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          const splitOpt = doc.splitTextToSize(opt.text, 160);
          doc.text(splitOpt, 34, currentY);
          currentY += Math.max(splitOpt.length * 3.5, 4.2);
        });

        currentY += 4;
      });

      // Practical Algorithmic Problem (if Hybrid/Practical)
      if (exam.examType === "practical_code" || exam.examType === "mixed" || !questionsToRender.length) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        doc.setTextColor(0, 51, 153);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.text(`Desafio Prático de Algoritmos — ${variant.domainScenario}`, 14, currentY);
        currentY += 5;

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        const splitStatement = doc.splitTextToSize(variant.problemStatement, 182);
        doc.text(splitStatement, 14, currentY);
        currentY += splitStatement.length * 3.8 + 4;
      }
    });

    // =========================================================================
    // FINAL PAGE: TEACHER MASTER ANSWER KEY & MATRIZ DE GABARITOS
    // =========================================================================
    doc.addPage();
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 26, "F");
    doc.setFillColor(239, 68, 68); // Red-500 Confidential bar
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(248, 113, 113);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("DOCUMENTO DE USO ESTRITO DO DOCENTE • GABARITO OFICIAL & MATRIZ DE CORREÇÃO", 14, 9);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`GABARITO MESTRE • ${exam.questionCount} QUESTÕES DE MÚLTIPLA ESCOLHA (A, B, C, D)`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`AVALIAÇÃO: ${exam.examTitle} • TODAS AS VARIANTES SINCRONIZADAS`, 14, 24);

    let masterY = 34;

    exam.variants.forEach((v) => {
      if (masterY > 230) {
        doc.addPage();
        masterY = 20;
      }

      doc.setTextColor(0, 51, 153);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`[GABARITO OFICIAL - VARIANTE ${v.variantId}] : ${v.title}`, 14, masterY);
      masterY += 4;

      const qRows = (v.questions || []).map(q => [
        `Q.${q.questionNumber}`,
        q.language.toUpperCase(),
        q.topic,
        `[ ${q.correctOption} ]`,
        q.explanation.substring(0, 90) + (q.explanation.length > 90 ? "..." : "")
      ]);

      safeAutoTable(doc, {
        startY: masterY,
        head: [["Questão", "Linguagem", "Tópico", "Gabarito", "Justificativa Pedagógica"]],
        body: qRows,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 6.8, fontStyle: "bold" },
        styles: { fontSize: 6.2, cellPadding: 1.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      masterY = getAutoTableFinalY(doc, masterY + 30) + 8;
    });

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generates a single student's personalized individual exam booklet with:
   * - Student's Name, Registration/Matrícula, Class Name, Unique Anti-Cheat Token
   * - All N multiple choice questions with 4 options (A, B, C, D)
   * - Integrated Optical Bubble Answer Sheet for rapid correction.
   */
  static exportStudentIndividualBookletPdf(booklet: StudentIndividualBooklet): Buffer {
    const doc = new jsPDF();

    // Institutional Header
    doc.setFillColor(0, 51, 153); // SENAI Blue
    doc.rect(0, 0, 210, 28, "F");
    doc.setFillColor(255, 204, 0); // SENAI Yellow
    doc.rect(0, 28, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI • ${booklet.courseName.toUpperCase()}`, 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`CADERNO INDIVIDUAL DE AVALIAÇÃO • [VARIANTE ${booklet.assignedVariant}]`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`DISCIPLINA: ${booklet.subject.toUpperCase()} • DURAÇÃO: ${booklet.durationMinutes} MIN • TOTAL: ${booklet.questions.length} QUESTÕES (4 OPÇÕES A/B/C/D)`, 14, 25);

    // Student Identification Box (Personalized)
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 33, 182, 25, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 33, 182, 25, 2, 2, "S");

    doc.setTextColor(0, 51, 153);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Estudante: ${booklet.studentName}`, 18, 40);
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Matrícula / ID: ${booklet.enrollmentCode || booklet.studentId}   |   Turma: ${booklet.className || "Geral"}   |   Posto: #${booklet.seatNumber || 1}`, 18, 46);
    doc.text(`Token de Autenticação Anti-Fraude: ${booklet.uniqueExamToken}`, 18, 52);

    let currentY = 63;

    // Render Questions
    booklet.questions.forEach((q, idx) => {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Question Header Bar
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, currentY, 182, 6.5, 1, 1, "F");
      doc.setTextColor(0, 51, 153);
      doc.setFontSize(7.8);
      doc.setFont("helvetica", "bold");
      doc.text(`QUESTÃO ${q.questionNumber || idx + 1} • [${q.language.toUpperCase()}] ${q.topic}`, 18, currentY + 4.5);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Nível: ${q.difficulty.toUpperCase()} | Bloom: ${q.bloomTaxonomy}`, 145, currentY + 4.5);

      currentY += 9;

      // Enunciado
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      const splitEnunciado = doc.splitTextToSize(q.enunciado, 180);
      doc.text(splitEnunciado, 14, currentY);
      currentY += splitEnunciado.length * 3.8 + 2;

      // Code Snippet (if present)
      if (q.codeSnippet) {
        const splitCode = q.codeSnippet.split("\n");
        const codeBoxHeight = Math.min(splitCode.length * 3.5 + 4, 38);
        
        if (currentY + codeBoxHeight > 275) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(15, 23, 42); // slate-900
        doc.roundedRect(14, currentY, 182, codeBoxHeight, 1.5, 1.5, "F");
        doc.setTextColor(226, 232, 240); // slate-200
        doc.setFont("courier", "normal");
        doc.setFontSize(6.5);

        splitCode.slice(0, 9).forEach((line, lIdx) => {
          doc.text(line.substring(0, 85), 18, currentY + 4 + lIdx * 3.5);
        });

        doc.setFont("helvetica", "normal");
        currentY += codeBoxHeight + 3;
      }

      // 4 Multiple Choice Options (A, B, C, D)
      q.options.forEach((opt) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(7.2);
        doc.setFont("helvetica", "bold");
        doc.text(`(   )  ${opt.letter})`, 18, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        const splitOpt = doc.splitTextToSize(opt.text, 160);
        doc.text(splitOpt, 34, currentY);
        currentY += Math.max(splitOpt.length * 3.5, 4.2);
      });

      currentY += 4;
    });

    // Optical Answer Sheet (Folha de Respostas / Cartão Óptico no final)
    doc.addPage();
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 24, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 24, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`SENAI • FOLHA OFICIAL DE RESPOSTAS (CARTÃO ÓPTICO)`, 14, 9);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`ESTUDANTE: ${booklet.studentName.toUpperCase()} • CADERNO [VARIANTE ${booklet.assignedVariant}]`, 14, 17);

    // Instructions Box
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(14, 30, 182, 14, 1.5, 1.5, "F");
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, 30, 182, 14, 1.5, 1.5, "S");
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "bold");
    doc.text("INSTRUÇÕES PARA PREENCHIMENTO DO CARTÃO DE RESPOSTAS:", 18, 35);
    doc.setFont("helvetica", "normal");
    doc.text("Preencha totalmente a bolha correspondente à alternativa correta (A, B, C ou D) com caneta azul ou preta.", 18, 40);

    // Bubble Grid
    const qCount = booklet.questions.length;
    const bubbleRows = [];
    for (let i = 1; i <= qCount; i++) {
      bubbleRows.push([
        `Questão ${i}`,
        "(  ) A",
        "(  ) B",
        "(  ) C",
        "(  ) D",
        "Assinatura do Aluno: ___________________"
      ]);
    }

    safeAutoTable(doc, {
      startY: 48,
      head: [["Item", "Opção A", "Opção B", "Opção C", "Opção D", "Validação"]],
      body: bubbleRows,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2, halign: "center" },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 26 },
        5: { halign: "left", fontSize: 6, cellWidth: 50 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Generates a batch PDF containing all individual booklets for the entire selected class,
   * cleanly paginated so it can be sent directly to printing.
   */
  static exportAllClassBookletsPdf(booklets: StudentIndividualBooklet[]): Buffer {
    const doc = new jsPDF();
    let isFirst = true;

    booklets.forEach((booklet) => {
      if (!isFirst) {
        doc.addPage();
      }
      isFirst = false;

      // Institutional Header
      doc.setFillColor(0, 51, 153);
      doc.rect(0, 0, 210, 28, "F");
      doc.setFillColor(255, 204, 0);
      doc.rect(0, 28, 210, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text(`SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI • ${booklet.courseName.toUpperCase()}`, 14, 9);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`CADERNO INDIVIDUAL • [VARIANTE ${booklet.assignedVariant}]`, 14, 18);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`DISCIPLINA: ${booklet.subject.toUpperCase()} • DURAÇÃO: ${booklet.durationMinutes} MIN • TOTAL: ${booklet.questions.length} QUESTÕES`, 14, 25);

      // Student Identification
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 33, 182, 24, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 33, 182, 24, 2, 2, "S");

      doc.setTextColor(0, 51, 153);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Estudante: ${booklet.studentName}   [Posto #${booklet.seatNumber || 1}]`, 18, 40);
      
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Matrícula / ID: ${booklet.enrollmentCode || booklet.studentId}   |   Turma: ${booklet.className || "Turma Geral"}`, 18, 46);
      doc.text(`Token de Integridade Anti-Fraude: ${booklet.uniqueExamToken}`, 18, 52);

      let currentY = 62;

      // Questions
      booklet.questions.forEach((q, idx) => {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, currentY, 182, 6.5, 1, 1, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(7.8);
        doc.setFont("helvetica", "bold");
        doc.text(`QUESTÃO ${q.questionNumber || idx + 1} • [${q.language.toUpperCase()}] ${q.topic}`, 18, currentY + 4.5);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(`Dificuldade: ${q.difficulty.toUpperCase()}`, 155, currentY + 4.5);

        currentY += 9;

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7.5);
        const splitEnunciado = doc.splitTextToSize(q.enunciado, 180);
        doc.text(splitEnunciado, 14, currentY);
        currentY += splitEnunciado.length * 3.8 + 2;

        if (q.codeSnippet) {
          const splitCode = q.codeSnippet.split("\n");
          const codeBoxHeight = Math.min(splitCode.length * 3.5 + 4, 38);
          
          if (currentY + codeBoxHeight > 275) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFillColor(15, 23, 42);
          doc.roundedRect(14, currentY, 182, codeBoxHeight, 1.5, 1.5, "F");
          doc.setTextColor(226, 232, 240);
          doc.setFont("courier", "normal");
          doc.setFontSize(6.5);

          splitCode.slice(0, 9).forEach((line, lIdx) => {
            doc.text(line.substring(0, 85), 18, currentY + 4 + lIdx * 3.5);
          });

          doc.setFont("helvetica", "normal");
          currentY += codeBoxHeight + 3;
        }

        q.options.forEach((opt) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }

          doc.setTextColor(15, 23, 42);
          doc.setFontSize(7.2);
          doc.setFont("helvetica", "bold");
          doc.text(`(   )  ${opt.letter})`, 18, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          const splitOpt = doc.splitTextToSize(opt.text, 160);
          doc.text(splitOpt, 34, currentY);
          currentY += Math.max(splitOpt.length * 3.5, 4.2);
        });

        currentY += 4;
      });
    });

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Generates a single-variant printable PDF strictly formatted to the SENAI standard (Backward compatible).
   */
  static exportSingleVariantPdf(variant: ParametricVariant, examInfo?: { examTitle?: string; courseName?: string; durationMinutes?: number; subject?: string }): Buffer {
    const doc = new jsPDF();
    const title = examInfo?.examTitle || variant.title;
    const course = examInfo?.courseName || "Técnico em Desenvolvimento de Sistemas - SENAI";
    const subject = examInfo?.subject || "Programação de Soluções Computacionais";
    const duration = examInfo?.durationMinutes || 90;

    // Header Bar
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 26, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI • ${course.toUpperCase()}`, 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`AVALIAÇÃO PRÁTICA INDIVIDUAL • CADERNO [VARIANTE ${variant.variantId}]`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`UNIDADE CURRICULAR: ${subject.toUpperCase()} • DURAÇÃO: ${duration} MIN • VALOR TOTAL: 100,0 PONTOS`, 14, 24);

    // Student Identification Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 38);
    doc.text("Data: ___/___/2026   Posto/Carteira: [       ]   Assinatura: _______________________________________", 18, 45);
    doc.text("Resultado Oficial:  [  ] APTO (>=60,0)   [  ] EM DESENVOLVIMENTO (<60,0)   Nota: [        /100,0]", 18, 51);

    // Problem Statement & Questions
    let nextY = 60;
    if (variant.questions && variant.questions.length > 0) {
      variant.questions.slice(0, 4).forEach((q) => {
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`Q.${q.questionNumber} [${q.language.toUpperCase()}] ${q.topic}`, 14, nextY);
        nextY += 4.5;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const sp = doc.splitTextToSize(q.enunciado, 180);
        doc.text(sp, 14, nextY);
        nextY += sp.length * 3.5 + 2;

        q.options.forEach((opt) => {
          doc.text(`(  ) ${opt.letter}) ${opt.text.substring(0, 80)}`, 18, nextY);
          nextY += 3.8;
        });
        nextY += 3;
      });
    } else {
      doc.setTextColor(0, 51, 153);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Situação de Aprendizagem Industrial — ${variant.domainScenario}`, 14, 79);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const splitStatement = doc.splitTextToSize(variant.problemStatement, 182);
      doc.text(splitStatement, 14, 84);
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Generates a separate, official Student Answer Sheet (Folha de Respostas Padronizada SENAI).
   */
  static exportAnswerSheetPdf(examInfo: { examTitle: string; courseName: string; variantId: ExamVariantLetter }): Buffer {
    const doc = new jsPDF();
    doc.setFillColor(0, 51, 153);
    doc.rect(0, 0, 210, 26, "F");
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI • ${examInfo.courseName.toUpperCase()}`, 14, 9);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`FOLHA OFICIAL DE RESPOSTAS E CÓDIGO [VARIANTE ${examInfo.variantId}]`, 14, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`AVALIAÇÃO: ${examInfo.examTitle.toUpperCase()} • DOCUMENTO VÁLIDO PARA CORREÇÃO`, 14, 24);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 32, 182, 22, 2, 2, "S");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("Nome do Estudante: __________________________________________________  Matrícula: _____________", 18, 38);
    doc.text("Data: ___/___/2026   Posto/Carteira: [       ]   Assinatura: _______________________________________", 18, 45);
    doc.text("Resultado Oficial:  [  ] APTO (>=60,0)   [  ] EM DESENVOLVIMENTO (<60,0)   Nota: [        /100,0]", 18, 51);

    // Numbered Grid (30 lines)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 58, 182, 224, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 58, 182, 224, 2, 2, "S");

    for (let i = 1; i <= 30; i++) {
      const lineY = 64 + (i * 7);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.text(String(i).padStart(2, "0") + " |", 18, lineY);
      doc.setDrawColor(241, 245, 249);
      doc.line(26, lineY, 192, lineY);
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Exports the variant to Moodle XML format for LMS import with 4 multiple choice options.
   */
  static exportVariantMoodleXml(variant: ParametricVariant): string {
    const sanitize = (str: string) => (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    let questionsXml = "";
    if (variant.questions && variant.questions.length > 0) {
      variant.questions.forEach((q, idx) => {
        questionsXml += `
  <question type="multichoice">
    <name><text>[SENAI][${q.language.toUpperCase()}] Q${idx + 1} - ${sanitize(q.topic)}</text></name>
    <questiontext format="html">
      <text><![CDATA[
        <p><strong>Questão ${idx + 1} (${sanitize(q.language)}):</strong> ${sanitize(q.enunciado)}</p>
        ${q.codeSnippet ? `<pre><code>${sanitize(q.codeSnippet)}</code></pre>` : ""}
      ]]></text>
    </questiontext>
    <generalfeedback format="html"><text><![CDATA[<p>${sanitize(q.explanation)}</p>]]></text></generalfeedback>
    <defaultgrade>1.0000000</defaultgrade>
    <single>true</single>
    <shuffleanswers>1</shuffleanswers>
    <answernumbering>abc</answernumbering>
    ${q.options.map(opt => `
    <answer fraction="${opt.isCorrect ? "100" : "0"}" format="html">
      <text><![CDATA[${sanitize(opt.text)}]]></text>
      <feedback format="html"><text><![CDATA[${sanitize(opt.explanation)}]]></text></feedback>
    </answer>`).join("")}
  </question>`;
      });
    } else {
      questionsXml = `
  <question type="essay">
    <name><text>[SENAI] ${sanitize(variant.title)}</text></name>
    <questiontext format="html">
      <text><![CDATA[
        <div style="font-family: sans-serif; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
          <h3 style="color: #003399;">${sanitize(variant.title)}</h3>
          <p><strong>Cenário Industrial:</strong> ${sanitize(variant.domainScenario)}</p>
          <p>${sanitize(variant.problemStatement)}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;"/>
          <p><strong>Requisitos e Restrições:</strong></p>
          <ul>${variant.constraints.map(c => `<li>${sanitize(c)}</li>`).join("")}</ul>
          <p><strong>Casos de Teste Públicos:</strong></p>
          <ul>${variant.testCases.filter(t => !t.isHidden).map(t => `<li><code>${sanitize(t.input)}</code> &rarr; <code>${sanitize(t.expectedOutput)}</code></li>`).join("")}</ul>
        </div>
      ]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<pre>${sanitize(variant.expectedSolutionCode)}</pre>]]></text>
    </generalfeedback>
    <defaultgrade>100.0000000</defaultgrade>
    <penalty>0.0000000</penalty>
    <responseformat>editor</responseformat>
    <responserequired>1</responserequired>
  </question>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
${questionsXml}
</quiz>`;
  }
}
