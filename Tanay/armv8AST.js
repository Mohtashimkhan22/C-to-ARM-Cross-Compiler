function convertToARM(code) {
  const lines = code.split('\n');
  let output = [];
  let varMap = {}; // Maps variable name to ARM register (X0, X1, ...)
  let regCount = 0;

  const getReg = (varName) => {
    if (!varMap[varName]) {
      varMap[varName] = `X${regCount++}`;
    }
    return varMap[varName];
  };

  for (let line of lines) {
    line = line.trim();
    if (!line || !line.includes('=')) continue;

    const parts = line.replace(';', '').split('=');
    const left = parts[0].trim();
    const right = parts[1].trim();

    // Constant assignment e.g., a = 5;
    if (/^\d+$/.test(right)) {
      const reg = getReg(left);
      output.push(`MOV ${reg}, #${right}    // ${left} = ${right}`);
    }

    // Simple arithmetic: a + b
    else if (right.includes('+')) {
      const [op1, op2] = right.split('+').map(x => x.trim());
      const regLeft = getReg(left);
      const reg1 = getReg(op1);
      const reg2 = getReg(op2);
      output.push(`ADD ${regLeft}, ${reg1}, ${reg2}    // ${left} = ${op1} + ${op2}`);
    }

    // Simple arithmetic: a - b
    else if (right.includes('-')) {
      const [op1, op2] = right.split('-').map(x => x.trim());
      const regLeft = getReg(left);
      const reg1 = getReg(op1);
      const reg2 = getReg(op2);
      output.push(`SUB ${regLeft}, ${reg1}, ${reg2}    // ${left} = ${op1} - ${op2}`);
    }
  }

  return output.join('\n');
}

document.getElementById("convertBtn").addEventListener("click", () => {
  const input = document.getElementById("inputCode").value;
  const asm = convertToARM(input);
  document.getElementById("outputAsm").textContent = asm || "No valid code found.";
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