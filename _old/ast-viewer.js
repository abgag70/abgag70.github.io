// ast-viewer.js
import * as ts from "https://esm.sh/typescript@5.2.2";

const codeInput         = document.getElementById("code");
const astOutput         = document.getElementById("astOutput");
const generateAstButton = document.getElementById("generateAst");
generateAstButton.addEventListener("click", generateAST);

async function generateAST() {
    const code = document.getElementById("code").value;
  
    // filenames
    const TS_FILE = "inMemory.ts";
    const ES5_LIB = "lib.es5.d.ts";
    const DOM_LIB = "lib.dom.d.ts";
  
    // 1) Compiler options: noLib = true, we'll supply exactly what we want
    const opts = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: true,
      noLib: true
    };
  
    // 2) Fetch the lib .d.ts texts
    const [es5Text, domText] = await Promise.all([
      fetch("https://esm.sh/typescript@5.2.2/lib/lib.es5.d.ts").then(r => r.text()),
      fetch("https://esm.sh/typescript@5.2.2/lib/lib.dom.d.ts").then(r => r.text()),
    ]);
  
    // 3) Minimal CompilerHost
    const host = {
      getSourceFile(name, lang) {
        if (name === TS_FILE) return ts.createSourceFile(name, code, lang, true);
        if (name === ES5_LIB) return ts.createSourceFile(name, es5Text, lang, true);
        if (name === DOM_LIB) return ts.createSourceFile(name, domText, lang, true);
        return undefined;
      },
      writeFile: () => {},
      fileExists(name) {
        return [TS_FILE, ES5_LIB, DOM_LIB].includes(name);
      },
      readFile(name) {
        if (name === TS_FILE) return code;
        if (name === ES5_LIB) return es5Text;
        if (name === DOM_LIB) return domText;
        return undefined;
      },
      getCurrentDirectory:       () => "",
      getCanonicalFileName:      f  => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine:                () => "\n",
      getDefaultLibFileName:     () => ES5_LIB,
      getDirectories:            () => []
    };
  
    // 4) Build the Program (note: TS_FILE, ES5_LIB, DOM_LIB)
    const program = ts.createProgram(
      [TS_FILE, ES5_LIB, DOM_LIB],
      opts,
      host
    );
  
    // 5) Diagnostics
    const diags = [
      ...program.getSyntacticDiagnostics(),
      ...program.getOptionsDiagnostics(),
      ...program.getSemanticDiagnostics()
    ];
  
    if (diags.length) {
      astOutput.textContent = diags.map(d => {
        let pos = { line: 0, character: 0 };
        if (d.file && typeof d.start === "number") {
          pos = d.file.getLineAndCharacterOfPosition(d.start);
        }
        const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        return d.file
          ? `${d.file.fileName} (${pos.line+1},${pos.character+1}): ❌ ${msg}`
          : msg;
      }).join("\n");
      return;
    }
  
    // 6) Print AST
    const sourceFile = program.getSourceFile(TS_FILE);
    if (!sourceFile) {
      astOutput.textContent = "❌ Could not retrieve AST.";
      return;
    }
  
    function printAST(node, indent = "", isLast = true) {
      const kind    = ts.SyntaxKind[node.kind];
      const snippet = node.getText
        ? node.getText().replace(/\s+/g, " ").trim().slice(0, 40)
        : "";
      const branch  = `${indent}${isLast ? "└─ " : "├─ "}${kind}${snippet ? ": "+snippet : ""}\n`;
      const children = node.getChildren();
      const newIndent = indent + (isLast ? "   " : "│  ");
      return branch
        + children.map((ch,i) => printAST(ch, newIndent, i === children.length-1)).join("");
    }
  
    astOutput.textContent = printAST(sourceFile);
  }
  
