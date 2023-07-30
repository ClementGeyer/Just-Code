import * as vscode from "vscode";
import { generateJSDocstringComment } from "./api";
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
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
  let functionName: string | undefined;

  // Non-nested files get right function, ReactJS get JSX main element
  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node as t.FunctionDeclaration;
      const { start, end } = node.loc!;
      if (position >= start.line && position <= end.line) {
        functionName = node.id?.name || 'unnamedFunction';
        docstring = `/**\n * Function ${functionName}\n * @param {void} paramName - desc\n * @returns {void} - desc\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(end.line, 0)
        );
        path.stop();
      }
    },
    ArrowFunctionExpression(path) {
      const node = path.node as t.ArrowFunctionExpression;
      const { loc } = node;
      if (loc && loc.start.line <= position && loc.end.line >= position) {
        //TODO: make a docstring better
        docstring = `/**\n * Arrow Function\n * @returns {void}\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(loc.start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(loc.end.line, 0)
        );
        path.stop();
      }
    },
  });

  if (!docstring) {
    vscode.window.showErrorMessage('Failed to generate docstring.');
    return;
  }

  if (functionRange) {
    let lastChildText: string;
    let functionText: string;
    let hasTab: boolean;
    let docStringComment: any;

    const cursorPosition = editor.selection.start

    // Handles ReactJS files, even if not .jsx
    const lastChild = findLastChildFunction(ast, editor.selection.active)

    // Perform custom selection to highlight the function range
    if(lastChild) {
      let lastChildRange = new vscode.Selection(lastChild?.start, lastChild?.end);
      editor.selection = lastChildRange
      lastChildText = editor.document.getText(lastChildRange);
      hasTab = hasTabulationBeforeFunction(lastChildText, lastChildRange, editor)
      docStringComment = await generateJSDocstringComment(lastChildText);
    } else {
      let range = new vscode.Selection(functionRange?.start, functionRange?.end)
      editor.selection = range
      functionText = editor.document.getText(functionRange);
      hasTab = hasTabulationBeforeFunction(functionText, range, editor)
      docStringComment = await generateJSDocstringComment(functionText);
    }

    editor.edit((editBuilder) => {
      const declarationLine = getFunctionDeclarationLine(ast, cursorPosition);

       // Get the indentation for the docstring comment
      const tabSize = editor.options.tabSize || 4; // Default tab size to 4 if tabSize is not defined
      const indentation = hasTab ? '\t' : ' '.repeat(tabSize);

      // Split the docstring comment into lines and add indentation to each line
      const indentedLines = docStringComment.content
        .split('\n')
        .map((line: string) => indentation + line)
        .join('\n');


      if(declarationLine){
        editBuilder.insert(new vscode.Position(declarationLine - 1, 0), indentedLines + '\n');
      }
        
    }); 
  }
})
}

// Rework this (might only need if non-nested file)
function getFunctionDeclarationLine(ast: t.File, position: vscode.Position): number | undefined {

  let lineNumber: number | undefined;

  traverse(ast, {
    FunctionDeclaration(path) {
      const fnNode = path.node as t.FunctionDeclaration;
      console.log(fnNode.loc?.start.line, position.line)
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line) {
        lineNumber = fnNode.loc.start.line
      }
    },
    ArrowFunctionExpression(path) {
      const arrowNode = path.node as t.ArrowFunctionExpression;
      //Maybe handle column positioning
      if (
        arrowNode.loc &&
        arrowNode.loc.start.line <= position.line + 1 &&
        arrowNode.loc.end.line >= position.line
      ) {
        lineNumber = arrowNode.loc.start.line
      }
    },
  });

  return lineNumber;
}

// Nested functions handle
function findLastChildFunction(node: t.Node, position: vscode.Position): { start: vscode.Position; end: vscode.Position } | null {
  let innermostFunction: { start: vscode.Position; end: vscode.Position } | null = null;

  traverse(node, {
    FunctionDeclaration(path) {
      const fnNode = path.node as t.FunctionDeclaration;
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line + 1) {
        innermostFunction = {
          start: new vscode.Position(fnNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(fnNode.loc.end.line, 0),
        };
      }
    },
    ArrowFunctionExpression(path) {
      const arrowNode = path.node as t.ArrowFunctionExpression;
      //Maybe handle column positioning
      if (
        arrowNode.loc &&
        arrowNode.loc.start.line <= position.line + 1 &&
        arrowNode.loc.end.line >= position.line + 1
      ) {
        innermostFunction = {
          start: new vscode.Position(arrowNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(arrowNode.loc.end.line, 0),
        };
      }
    },
  });

  console.log(innermostFunction)
  return innermostFunction;
}

function hasTabulationBeforeFunction(code: string, functionRange: vscode.Range, editor: vscode.TextEditor): boolean {
  const startLine = functionRange.start.line;

  // Get the text of the entire line before the function start position
  const lineBeforeFunction = editor.document.lineAt(startLine).text;

  // Check if there are any non-whitespace characters before the function start position
  return /\S/.test(lineBeforeFunction);
}
