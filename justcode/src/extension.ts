// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { contextProvider } from './provider';
import { insertDocstringComment } from './commands';
import { authenticate, getLoginSentence } from './authenticate';
import { TokenManager } from "./TokenManager";
import type { User } from "./types";

import { apiBaseUrl, localhostBaseUrl } from "./const";
import { getUser } from "./api";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	TokenManager.globalState = context.globalState;

	console.log('Congratulations, your extension "justcode" is now active!');

	let accessToken: string = TokenManager.getToken() || "";

    let user: User | null = await getUser(accessToken);

	if(user){
		let loginSentence: string = getLoginSentence(user);
		vscode.window.showInformationMessage(loginSentence, 'Logout').then(async selected => {
			if(selected === "Logout"){
				TokenManager.setToken("")
				vscode.window.showInformationMessage('You are logged out');
				user = null;
			}
		});
	} else {
		vscode.window.showInformationMessage("Please log in with GitHub in order to use JustCode Pro", "Authenticate").then(async selected => {
			if(selected === "Authenticate"){
				try{
					authenticate();
					user = await getUser(accessToken);
				} catch(e){
					vscode.window.showErrorMessage("Failed to authenticate")
				}
			}
		});
		
	}

	let login = vscode.commands.registerCommand("justcode.authenticate", async () => {
		console.log(user)
		if(!user){
			try {
				authenticate();
				user = await getUser(accessToken);
			} catch (err) {
				vscode.window.showErrorMessage("Failed to authenticate");
			}
		} else{
			vscode.window.showErrorMessage("You are already authenticated");
		}
	})

	let logout = vscode.commands.registerCommand(
		"justcode.logout",
		() => { 
			if(user){
				TokenManager.setToken("")
				vscode.window.showInformationMessage('You are logged out');
				user = null;
			} else {
				vscode.window.showErrorMessage("You are not authenticated");
			}	
		}
	);

	let docstringCommand = vscode.commands.registerCommand(
		"justcode.docStringComment",
		insertDocstringComment
	);

	context.subscriptions.push(docstringCommand, contextProvider, login, logout)
}

// This method is called when your extension is deactivated
export function deactivate() {}
