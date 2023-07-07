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

        // Text selected or not
        if (selection && !selection.isEmpty) {
            const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            const highlighted = activeEditor.document.getText(selectionRange);

            // let data = await generateComment(highlighted);

            activeEditor.edit(editBuilder => {
                editBuilder.insert(activeEditor.selection.active, "data.content")
            })
        } else {
          //get next line text and remove spaces
          const nextLine = activeEditor.document.lineAt(selection.active.line + 1).text;
          if(nextLine){
            console.log(nextLine.trim())
          }
        }
    });
}