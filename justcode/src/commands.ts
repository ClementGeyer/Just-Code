import * as vscode from "vscode";
import { IContextArgs } from "./interfaces";
import { generateComment } from "./api";

export const insertInlineCommentCommand = () => {
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

        if (selection && !selection.isEmpty) {
            const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            const highlighted = activeEditor.document.getText(selectionRange);

            let data = await generateComment(highlighted);
            console.log(data)

            activeEditor.edit(editBuilder => {
                editBuilder.insert(activeEditor.selection.active, data.content)
            })
        }
    });
}