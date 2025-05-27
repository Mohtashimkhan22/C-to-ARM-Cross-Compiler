// optimizedAST.js

function tokenize(input) {
  const regex = /\s*([A-Za-z]+|\d+|\S)\s*/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

function parseExpression(input) {
  const tokens = tokenize(input);
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume() {
    return tokens[index++];
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error("Unexpected end of input");

    if (/^\d+$/.test(token)) {
      consume();
      return { type: "NumberLiteral", value: Number(token) };
    }

    if (/^[A-Za-z]+$/.test(token)) {
      consume();
      return { type: "Identifier", name: token };
    }

    if (token === "(") {
      consume();
      const expr = parseAddSub();
      if (consume() !== ")") {
        throw new Error("Expected ')'");
      }
      return expr;
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  function parseMulDiv() {
    let node = parsePrimary();

    while (peek() === "*" || peek() === "/") {
      const operator = consume();
      const right = parsePrimary();
      node = {
        type: "BinaryExpression",
        operator,
        left: node,
        right: right
      };
    }

    return node;
  }

  function parseAddSub() {
    let node = parseMulDiv();

    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      const right = parseMulDiv();
      node = {
        type: "BinaryExpression",
        operator,
        left: node,
        right: right
      };
    }

    return node;
  }

  const ast = {
    type: "Program",
    body: [parseAddSub()]
  };

  if (index < tokens.length) {
    throw new Error(`Unexpected token: ${peek()}`);
  }

  return ast;
}
function analyze() {
  const code = codeInput.value;
  if (!code.trim()) {
    output.textContent = "Please enter some code before analyzing.";
    return;
  }

  switch (currentAction) {
    case 'lexical':
      const tokens = lexicalAnalysis(code);
      output.textContent = tokens.length === 0
        ? "No tokens found."
        : tokens.map(tok => `[${tok.type}] : "${tok.value}"`).join("\n");
      break;

    case 'syntax':
      output.textContent = syntaxAnalysis(code);
      break;

    case 'semantic':
      output.textContent = semanticAnalysis(code);
      break;

    case 'symbolTable':
      output.textContent = symbolTable(code);
      break;

    default:
      output.textContent = "Unknown analysis option.";
  }
}

codeInput.addEventListener('input', analyze);
analyze();
// Button event handling
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.action === currentAction) return;
    buttons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentAction = btn.dataset.action;
    analyze();
  });
});
