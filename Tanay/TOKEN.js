// tokenCounter.js

/**
 * Tokenizes input text and displays both token count and the tokens.
 * A token is approximated as any non-empty word separated by whitespace.
 */


function countAndShowTokens() {
  const inputElement = document.getElementById('inputText');
  const countElement = document.getElementById('tokenCount');
  const listElement = document.getElementById('tokenList');

  if (!inputElement || !countElement || !listElement) {
    console.error("Missing inputText, tokenCount, or tokenList element.");
    return;
  }

  const text = inputElement.value.trim();
  const tokens = text.split(/\s+/).filter(Boolean);

  // Show token count
  countElement.innerText = `Token count: ${tokens.length}`;

  // Show tokens
  listElement.innerHTML = ""; // Clear previous list
  tokens.forEach((token, index) => {
    const li = document.createElement("li");
    li.textContent = `Token ${index + 1}: ${token}`;
    listElement.appendChild(li);
  });
}

// Attach event listener after DOM loads
window.addEventListener('DOMContentLoaded', () => {
  const countButton = document.getElementById('countButton');
  if (countButton) {
    countButton.addEventListener('click', countAndShowTokens);
  }
});

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

