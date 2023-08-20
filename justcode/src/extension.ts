// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { contextProvider } from './provider';
import { insertDocstringComment } from './commands';
import { authenticate } from './authenticate';
import { TokenManager } from "./TokenManager";
import type { User } from "./types";
import fetch from 'node-fetch';
import { apiBaseUrl, localhostBaseUrl } from "./const";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	TokenManager.globalState = context.globalState;

	console.log('Congratulations, your extension "justcode" is now active!');

	let accessToken = TokenManager.getToken();

    let user: User | null = null;

    const response = await fetch(`${apiBaseUrl}/me`, {
        headers: {
            authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    user = (<any>data).user;

	if(user){
		vscode.window.showInformationMessage("You are logged in as: " + user?.name, 'Logout').then(selected => {
			if(selected === "Logout"){
				TokenManager.setToken("")
				vscode.window.showInformationMessage("You are logged out")
			}
		});
		let logout = vscode.commands.registerCommand(
			"justcode.logout",
			() => { TokenManager.setToken("") }
		);
		context.subscriptions.push(logout);
	} else {
		vscode.window.showInformationMessage("Please log in to use JustCode", "Authenticate").then(async selected => {
			if(selected === "Authenticate"){
				authenticate();
			}
		});
		context.subscriptions.push(
			vscode.commands.registerCommand("justcode.authenticate", () => {
				try {
					authenticate();
				} catch (err) {
					console.log(err);
				}
			})
		);
	}

	let docstringCommand = vscode.commands.registerCommand(
		"justcode.docStringComment",
		insertDocstringComment
	);

	context.subscriptions.push(docstringCommand, contextProvider)
}

// This method is called when your extension is deactivated
export function deactivate() {}
