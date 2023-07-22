import * as vscode from "vscode";
import { generateJSDocstringComment } from "./api";
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export async function insertDocstringComment() {
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
  }, async (progress) => {

  if (!vscode.window.activeTextEditor) {
      return;
    }
  
  progress.report({
    message: `Generating comments ...`,
  });

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor.');
    return;
  }

  const selection = editor.selection;
  const { start, end } = selection;
  const position = start.line + 1; // Adjust for 0-indexing

  const code = editor.document.getText();
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
    // loc: true,
  });

  let docstring = '';
  let functionRange: vscode.Range | undefined;

  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node as t.FunctionDeclaration;
      const { start, end } = node.loc!;
      if (position >= start.line && position <= end.line) {
        const functionName = node.id?.name || 'unnamedFunction';
        docstring = `/**\n * Function ${functionName}\n * @param {void} paramName - desc\n * @returns {void} - desc\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(end.line, 0)
        );
        path.stop(); // Stop traversing the AST as we found the enclosing function.
      }
    },
  });

  if (!docstring) {
    vscode.window.showErrorMessage('Failed to generate docstring.');
    return;
  }

  if (functionRange) {
    // Get the text of the function
    const functionText = editor.document.getText(functionRange);

    // Perform custom selection to highlight the function range
    editor.selection = new vscode.Selection(functionRange.start, functionRange.end);

    const docStringComment = await generateJSDocstringComment(functionText);

    editor.edit((editBuilder) => {
      const declarationLine = getFunctionDeclarationLine(code);
      if(declarationLine)
        editBuilder.insert(new vscode.Position(declarationLine - 1, 0), docStringComment.content + '\n\n');
    });
  }
})
}

function getFunctionDeclarationLine(code: string): number | undefined {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
    //loc: true,
  });

  let lineNumber: number | undefined;

  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node as t.FunctionDeclaration;
      lineNumber = node.loc?.start.line;
      path.stop(); // Stop traversing the AST as we found the function declaration.
    },
  });

  return lineNumber;
}