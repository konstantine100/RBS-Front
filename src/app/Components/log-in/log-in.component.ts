import { Component } from '@angular/core';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.scss'
})
export class LogInComponent {
    handleLoginWithGoogle = () => {
    const popup = window.open(
      "https://localhost:44341/api/Google/login/google?returnUrl=http://localhost:4200/auth/callback",
      "googleAuth",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );


    const messageListener = (event: MessageEvent) => {
      if (event.origin !== "http://localhost:4200") {
        return;
      }

      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        console.log("Google authentication successful");
        
        popup?.close();
        
        window.removeEventListener("message", messageListener);
        
        this.onAuthSuccess();
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {

        console.error("Google authentication failed:", event.data.error);
        
        popup?.close();
        
        window.removeEventListener("message", messageListener);
        
        this.onAuthError(event.data.error);
      }
    };

    window.addEventListener("message", messageListener);

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        console.log("Popup was closed by user");
      }
    }, 1000);
  }

  private onAuthSuccess() {
    
    console.log("User authenticated successfully");
    window.location.reload();
  }

  private onAuthError(error: string) {

    console.error("Authentication error:", error);
    alert("Authentication failed. Please try again.");
  }
}
