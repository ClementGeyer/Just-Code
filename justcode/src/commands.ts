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

export function generateDocstringComment() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor.');
    return;
  }

  const selection = editor.selection;
  const { start, end } = selection;

  const docstring = generateDocStringForFunction(editor.document, start.line);
  if (!docstring) {
    vscode.window.showErrorMessage('Failed to generate docstring.');
    return;
  }

  editor.edit((editBuilder) => {
    editBuilder.insert(start.with(undefined, 0), docstring + '\n\n');
  });
}

function generateDocStringForFunction(document: vscode.TextDocument, line: number): string | undefined {
  const lineText = document.lineAt(line).text.trim();

  // Check if the line contains a function declaration
  const functionRegex = /function\s+(\w+)\s*\([^)]*\)/;
  const matches = lineText.match(functionRegex);

  if (matches) {
    const functionName = matches[1];
    const docstring = `/**\n * Function ${functionName}\n * @returns {void}\n */`;
    return docstring;
  }

  return undefined;
}