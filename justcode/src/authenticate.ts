import * as vscode from "vscode";
import { apiBaseUrl, localhostBaseUrl } from "./const";
import * as polka from "polka";
import { TokenManager } from "./TokenManager";
import type { User } from "./types";
import fetch from 'node-fetch';

export const authenticate = () => {
  const app = polka();

  app.get(`/auth/:token`, async (req, res) => {
    const { token } = req.params;
    if (!token) {
      res.end(`<h1>something went wrong</h1>`);
      return;
    }

    await TokenManager.setToken(token);

    res.end(`<h1>auth was successful, you can close this now</h1>`);

    let accessToken = TokenManager.getToken();
    let user: User | null = null;

    const response = await fetch(`${localhostBaseUrl}/me`, {
        headers: {
            authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    user = (<any>data).user;

    vscode.window.showInformationMessage("Bienvenue: " + user?.name);      

    (app as any).server.close();
  });

  app.listen(54321, (err: Error) => {
    if (err) {
      vscode.window.showErrorMessage(err.message);
    } else {
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.parse(`${localhostBaseUrl}/auth/github`)
      );
    }
  });
};