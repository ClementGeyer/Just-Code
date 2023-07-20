import * as vscode from "vscode";
import * as ts from 'typescript';
import { generateSingleLineShortComment } from "./api";

export const insertDocstringCommentCommand = () => {
  vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
    }, async (progress) => {

      if (!vscode.window.activeTextEditor) {
          return;
        }
      
      progress.report({
        message: `Generating comments ...`,
      });
      
      let activeEditor = vscode.window.activeTextEditor;

      if (!activeEditor) {
          return;
      }

      // Select the highlighted text
      const selection = activeEditor.selection

      // Text selected or not
      if (selection && !selection.isEmpty) {
          const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
          const highlighted = activeEditor.document.getText(selectionRange);

          // let data = await generateComment(highlighted);

          activeEditor.edit(editBuilder => {
              editBuilder.insert(activeEditor.selection.active, "data.content")
          })
      } else {
        
      }
  });
}

export const testGetRange = async () => {
  const result = await generateFunctionDocstring();
  if (result) {
    const { range, text } = result;
    console.log("Range:", range);
    console.log("Docstring Text:", text);
  } else {
    console.log("No function symbol found at the cursor position.");
  }
};

async function generateFunctionDocstring(): Promise<{ range: vscode.Range, text: string } | undefined> {
  const document = vscode.window.activeTextEditor?.document;
  const position = vscode.window.activeTextEditor?.selection.active;
  if (!document || !position) {
    return undefined;
  }

  try {
    const symbols = await getDocumentSymbols(document);
    const functionSymbol = await findSymbolAtPosition(symbols, position);
    console.log(functionSymbol?.kind)
    console.log(vscode.SymbolKind.Function)

    if (functionSymbol?.kind === vscode.SymbolKind.Function) {
      const functionInfo = extractFunctionInformation(functionSymbol);
      console.log(functionInfo)
      if (functionInfo) {
        const docstring = generateDocstring(functionInfo);
        return { range: functionSymbol.range, text: docstring };
      }
    }
  } catch (error) {
    console.error("Error generating function docstring:", error);
  }

  return undefined;
}

interface FunctionInfo {
  name: string;
  parameters: string[];
  returnType: string;
}

function extractFunctionInformation(functionSymbol: vscode.DocumentSymbol): FunctionInfo | undefined {
  const functionNode = findFunctionNode(functionSymbol);
  if (!functionNode) {
    return undefined;
  }

  const name = functionSymbol.name;
  const parameters = extractParameters(functionNode);
  const returnType = extractReturnType(functionNode);

  return { name, parameters, returnType };
}

function findFunctionNode(symbol: vscode.DocumentSymbol): ts.FunctionLikeDeclaration | undefined {
  console.log(symbol)
  const sourceCode = symbol.document.getText();
  const sourceFile = ts.createSourceFile(symbol.document.fileName, sourceCode, ts.ScriptTarget.Latest, true);

  const startPosition = symbol.range.start.translate(0, 1);
  const endPosition = symbol.range.end.translate(0, -1);
  const functionNode = findChildContainingPosition(sourceFile, startPosition, endPosition);

  return functionNode;
}

function findChildContainingPosition(node: ts.Node, startPosition: vscode.Position, endPosition: vscode.Position): ts.Node | undefined {
  if (node.getStart() <= startPosition.offset && node.getEnd() >= endPosition.offset) {
    const children = node.getChildren();
    for (const child of children) {
      const result = findChildContainingPosition(child, startPosition, endPosition);
      if (result) {
        return result;
      }
    }
    return node;
  }
  return undefined;
}

function extractParameters(functionNode: ts.FunctionLikeDeclaration): string[] {
  const parameters: string[] = [];
  if (functionNode.parameters) {
    for (const param of functionNode.parameters) {
      if (param.name && ts.isIdentifier(param.name)) {
        parameters.push(param.name.getText());
      }
    }
  }
  return parameters;
}

function extractReturnType(functionNode: ts.FunctionLikeDeclaration): string {
  const signature = functionNode.signatures[0]; // Assuming a single signature for simplicity
  if (signature && signature.type) {
    return signature.type.getText();
  }
  return "void"; // Default return type if not specified
}

function generateDocstring(functionInfo: FunctionInfo): string {
  // Generate the docstring based on the function information.
  // You can use a template to create a standardized docstring format.
  // For example:
  const { name, parameters, returnType } = functionInfo;
  const paramsString = parameters.map(param => `@param ${param} - Description of ${param}`).join("\n");
  const returnsString = `@returns {${returnType}} - Description of the return value`;
  return `
    /**
     * Description of the function.
     * @function
     * @name ${name}
    ${paramsString}
    ${returnsString}
    */
    `;
}

function insertDocstringAboveFunction(document: vscode.TextDocument, position: vscode.Position, docstring: string) {
  // Insert the generated docstring comment above the function's definition
  // at the appropriate location in the document.
  // You can use the VSCode TextEdit API to perform the insertion.
  const edit = new vscode.WorkspaceEdit();
  const insertPosition = new vscode.Position(position.line, 0);
  edit.insert(document.uri, insertPosition, docstring);
  vscode.workspace.applyEdit(edit);
}

async function getDocumentSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
  if (!document) {
    throw new Error("No document provided.");
  }

  try {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      document.uri
    );

    return symbols || [];
  } catch (error) {
    console.error("Error retrieving document symbols:", error);
    return [];
  }
}

function findSymbolAtPosition(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol | undefined {
  for (const symbol of symbols) {
    if (symbol.range.contains(position)) {
      return symbol;
    }
  }
  return undefined;
}