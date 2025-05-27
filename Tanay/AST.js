// astGenerator.js

/**
 * Generates a simple mock AST from input text.
 * Each word (token) is treated as a node in a flat tree.
 * 
 * @param {string} text - The input text to parse.
 * @returns {object} AST object
 */
function generateAST(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);

  return {
    type: "Program",
    body: tokens.map((token, index) => ({
      type: "Literal",
      value: token,
      position: index + 1
    }))
  };
}

// Example usage:
const exampleInput = "This is a simple AST example.";
const ast = generateAST(exampleInput);
console.log(JSON.stringify(ast, null, 2));
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
