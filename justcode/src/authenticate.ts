import * as vscode from "vscode";
import { apiBaseUrl, websiteBaseUrl } from "./const";
import * as polka from "polka";
import { TokenManager } from "./TokenManager";
import type { User } from "./types";
import fetch from 'node-fetch';

export async function authenticate() {
  const app = polka();

  app.get(`/auth/:token`, async (req, res) => {
    const { token } = req.params;
    if (!token) {
      res.end(`<h1>something went wrong</h1>`);
      return;
    }

    await TokenManager.setToken(token);

    res.end(`<h1>auth was successful, you can close this now</h1>`);

    let user: User | null = null;

    const response = await fetch(`${apiBaseUrl}/me`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    user = (<any>data).user;

    if(user){
      let loginSentence: string = getLoginSentence(user);
      let showWebsitePricing: boolean = isShowWebsitePricing(user);
      if(showWebsitePricing){
        vscode.window.showInformationMessage(loginSentence, ...["Purchase premium"]).then(() => {
          vscode.commands.executeCommand(
            "vscode.open",
            vscode.Uri.parse(websiteBaseUrl + "/pricing")
          );
        });
      } else {
        vscode.window.showInformationMessage(loginSentence);
      }
    } else {
      vscode.window.showErrorMessage("Failed to authenticate");
    }

    (app as any).server.close(); 
  });

  app.listen(54321, (err: Error) => {
    if (err) {
      vscode.window.showErrorMessage(err.message);
    } else {
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.parse(`${apiBaseUrl}/auth/github`)
      );
    }
  });
};

export function getLoginSentence(user: User){
  let loginSentence: string = "";
  console.log(user)
  if(freeTrialsDaysLeft(user.freeTrial) > 0 && user.subscriptionStatus !== "paid"){
    loginSentence = "You are logged in as: " + user?.name + "! You have " + freeTrialsDaysLeft(user.freeTrial) + " days remaining on your free trial"
  }else if(user.premium){
    loginSentence = "You are logged in as: " + user?.name + "! Pro plan is activated"
  }else{
    loginSentence = "You are logged in as: " + user?.name;
  }
  return loginSentence
}

export function isShowWebsitePricing(user: User){
  let isNotPremium = false;
  console.log(freeTrialsDaysLeft(user.freeTrial), user.premium)
  if(freeTrialsDaysLeft(user.freeTrial) <= 0 && !user.premium){
    isNotPremium = true
  }
  return isNotPremium
}

function freeTrialsDaysLeft(startDate: Date) {
  const currentDate = new Date();
  const startDateFormat = new Date(startDate);
  const diffTime = currentDate.valueOf() - startDateFormat.valueOf();
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)); 
  return 16 - diffDays
}