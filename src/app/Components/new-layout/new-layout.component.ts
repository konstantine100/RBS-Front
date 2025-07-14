import { Component, OnInit, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { LayoutServiceService } from '../../Services/layout-service.service';

@Component({
  selector: 'app-new-layout',
  templateUrl: './new-layout.component.html',
  styleUrl: './new-layout.component.scss'
})
export class NewLayoutComponent {
    spaceId = 2;
  layoutData: any[] = [];
  private hubConnection!: signalR.HubConnection;

  constructor(private layoutService: LayoutServiceService) {}

  ngOnInit() {
    this.startConnection();
    this.addSignalRListeners();
    this.loadLayout(); 
  }

  private startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:44341/restaurantHub')
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        this.hubConnection.invoke('JoinSpaceGroup', this.spaceId);
      })
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  private addSignalRListeners() {
    // NEW: Layout change listener
    this.hubConnection.on('LayoutChanged', (data) => {
      console.log('Layout changed:', data);
      if (data.spaceId === this.spaceId) {
        this.handleLayoutChange(data);
      }
    });

    // Existing listeners
    this.hubConnection.on('TableReserved', (data) => {
      console.log('Table reserved:', data);
    });

    this.hubConnection.on('TableExpired', (data) => {
      console.log('Table expired:', data);
    });

    this.hubConnection.on('ChairReserved', (data) => {
      console.log('Chair reserved:', data);
    });

    this.hubConnection.on('ChairExpired', (data) => {
      console.log('Chair expired:', data);
    });

    this.hubConnection.on('SpaceReserved', (data) => {
      console.log('Space reserved:', data);
    });

    this.hubConnection.on('SpaceExpired', (data) => {
      console.log('Space expired:', data);
    });

    this.hubConnection.on('LayoutChanged', (data) => {
      console.log('Layout changed:', data);
      if (data.spaceId === this.spaceId) {
        this.handleLayoutChange(data);
      }
    });
  }

  // Load layout data
  private loadLayout() {
    this.layoutService.getCurrentLayout(this.spaceId).subscribe({
      next: (response) => {
        console.log('Layout loaded:', response);
        this.layoutData = response.data || [];
      },
      error: (error) => {
        console.error('Error loading layout:', error);
      }
    });
  }

  // Handle layout changes
  private handleLayoutChange(event: any) {
    console.log('Handling layout change:', event);
    
    switch (event.changeType) {
      case 'TableReservation':
        console.log('Table reservation created/updated');
        break;
      case 'BookingCompleted':
        console.log('Booking completed');
        break;
      case 'BookingCancelled':
        console.log('Booking cancelled:', event.data);
        break;
      case 'ReservationExpired':
        console.log('Reservation expired');
        break;
      default:
        console.log('Layout change:', event.changeType);
    }
    
    // Reload the layout data
    this.loadLayout();
  }

  //Method to manually refresh layout
  refreshLayout() {
    this.loadLayout();
  }

  ngOnDestroy() {
    if (this.hubConnection) {
      this.hubConnection.invoke('LeaveSpaceGroup', this.spaceId)
        .then(() => {
          this.hubConnection.stop();
        })
        .catch(err => console.log('Error while stopping connection: ' + err));
    }
  }

}
