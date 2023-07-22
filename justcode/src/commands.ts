import * as vscode from "vscode";
import * as ts from 'typescript';
import { generateSingleLineShortComment } from "./api";
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

let highlightDecorationType: vscode.TextEditorDecorationType | undefined;

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

export function insertDocstringComment() {
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
        docstring = `/**\n * Function ${functionName}\n * @returns {void}\n */`;
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
    // Perform custom selection to highlight the function range
    editor.selection = new vscode.Selection(functionRange.start, functionRange.end);
  }

  editor.edit((editBuilder) => {
    const declarationLine = getFunctionDeclarationLine(code);
    if(declarationLine)
      editBuilder.insert(new vscode.Position(declarationLine - 1, 0), docstring + '\n\n');
  });
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