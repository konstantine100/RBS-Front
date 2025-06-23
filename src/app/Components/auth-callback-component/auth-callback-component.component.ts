import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-callback-component',
  templateUrl: './auth-callback-component.component.html',
  styleUrl: './auth-callback-component.component.scss'
})
export class AuthCallbackComponentComponent implements OnInit {
   constructor(private route: ActivatedRoute) {}

  ngOnInit() {
   
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        
        this.sendMessageToParent('GOOGLE_AUTH_ERROR', params['error']);
      } else {
        
        this.sendMessageToParent('GOOGLE_AUTH_SUCCESS', null);
      }
    });
  }

  private sendMessageToParent(type: string, error: string | null) {
    if (window.opener) {
      const message = {
        type: type,
        error: error
      };
      
    
      window.opener.postMessage(message, "http://localhost:4200");
      
      
      window.close();
    } else {
      console.error("No parent window found");
      
      window.location.href = "http://localhost:4200/";
    }
  }
}
