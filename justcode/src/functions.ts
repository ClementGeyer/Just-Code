import * as vscode from 'vscode';

export const getNextLine = (_position: vscode.Position, _lang: string) => {
    if(vscode.window.activeTextEditor){
        // TODO: gérer les cas spéciaux (ligne vide, etc.)
        const context = vscode.window.activeTextEditor;
        const currentLineRange = context.document.lineAt(context.selection.active.line + 1);
        const nextLineText = currentLineRange.text.trim()
        return nextLineText
    } else {
        // TODO: maybe return an error
    }
}
    