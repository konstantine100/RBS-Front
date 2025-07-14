// signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LayoutByHour {
  spaceId?: number;
  tableId?: number;
  chairId?: number;
  space?: any;
  table?: any;
  chair?: any;
  status: string; // This will be the string representation of AVAILABLE_STATUS enum
  bookingId?: number;
  reservationId?: number;
  walkInId?: number;
}

// Add enum to match C# AVAILABLE_STATUS
export enum AVAILABLE_STATUS {
  None = 'None',
  Reserved = 'Reserved',
  Booked = 'Booked',
  WalkIn = 'WalkIn',
  Announced = 'Announced',
  Not_Announced = 'Not_Announced',
  Finished = 'Finished'
}

export interface BookingCancelledData {
  tableId?: number;
  chairId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private connectionState = new BehaviorSubject<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);
  
  // Layout data streams
  private layoutUpdated = new BehaviorSubject<LayoutByHour[]>([]);
  private bookingCreated = new BehaviorSubject<LayoutByHour | null>(null);
  private bookingCancelled = new BehaviorSubject<BookingCancelledData | null>(null);
  private reservationCreated = new BehaviorSubject<LayoutByHour | null>(null);
  private walkInCreated = new BehaviorSubject<LayoutByHour | null>(null);

  // Observables for components to subscribe to
  public layoutUpdated$ = this.layoutUpdated.asObservable();
  public bookingCreated$ = this.bookingCreated.asObservable();
  public bookingCancelled$ = this.bookingCancelled.asObservable();
  public reservationCreated$ = this.reservationCreated.asObservable();
  public walkInCreated$ = this.walkInCreated.asObservable();
  public connectionState$ = this.connectionState.asObservable();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      // FIX: Use the correct SignalR hub URL
      .withUrl('https://localhost:44341/HostLayoutHub', {
        // FIX: Allow SignalR to negotiate the best transport
        // Don't skip negotiation unless you're sure about WebSockets support
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
        // Remove skipNegotiation to allow proper transport negotiation
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Connection state handlers
    this.hubConnection.onreconnecting(() => {
      console.log('SignalR: Attempting to reconnect...');
      this.connectionState.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR: Reconnected successfully');
      this.connectionState.next(signalR.HubConnectionState.Connected);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR: Connection closed', error);
      this.connectionState.next(signalR.HubConnectionState.Disconnected);
    });

    // Layout update handlers
    this.hubConnection.on('LayoutUpdated', (updatedLayout: LayoutByHour[]) => {
      console.log('Layout updated:', updatedLayout);
      this.layoutUpdated.next(updatedLayout);
    });

    this.hubConnection.on('BookingCreated', (newBooking: LayoutByHour) => {
      console.log('Booking created:', newBooking);
      this.bookingCreated.next(newBooking);
    });

    this.hubConnection.on('BookingCancelled', (data: BookingCancelledData) => {
      console.log('Booking cancelled:', data);
      this.bookingCancelled.next(data);
    });

    this.hubConnection.on('ReservationCreated', (newReservation: LayoutByHour) => {
      console.log('Reservation created:', newReservation);
      this.reservationCreated.next(newReservation);
    });

    this.hubConnection.on('WalkInCreated', (newWalkIn: LayoutByHour) => {
      console.log('Walk-in created:', newWalkIn);
      this.walkInCreated.next(newWalkIn);
    });

    // Test response handler
    this.hubConnection.on('TestResponse', (message: string) => {
      console.log('Test response received:', message);
    });
  }

  public async startConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      try {
        console.log('SignalR: Starting connection...');
        await this.hubConnection.start();
        console.log('SignalR: Connected successfully');
        this.connectionState.next(signalR.HubConnectionState.Connected);
      } catch (error) {
        console.error('SignalR: Error starting connection:', error);
        this.connectionState.next(signalR.HubConnectionState.Disconnected);
        throw error;
      }
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.stop();
        console.log('SignalR: Connection stopped');
        this.connectionState.next(signalR.HubConnectionState.Disconnected);
      } catch (error) {
        console.error('SignalR: Error stopping connection:', error);
        throw error;
      }
    }
  }

  public async joinSpaceGroup(spaceId: number): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        console.log(`Attempting to join space group: ${spaceId}`);
        await this.hubConnection.invoke('JoinSpaceGroup', spaceId);
        console.log(`Successfully joined space group: ${spaceId}`);
      } catch (error) {
        console.error('Error joining space group:', error);
        console.error('SpaceId:', spaceId);
        console.error('Connection State:', this.hubConnection.state);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }

  // Add test method
  public async testConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('TestConnection');
        console.log('Test connection successful');
      } catch (error) {
        console.error('Test connection failed:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }

  public async leaveSpaceGroup(spaceId: number): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveSpaceGroup', spaceId);
        console.log(`Left space group: ${spaceId}`);
      } catch (error) {
        console.error('Error leaving space group:', error);
        throw error;
      }
    }
  }

  public isConnected(): boolean {
    return this.hubConnection.state === signalR.HubConnectionState.Connected;
  }

  public getConnectionState(): signalR.HubConnectionState {
    return this.hubConnection.state;
  }

  // Helper method to connect and join space group in one call
  public async connectToSpace(spaceId: number): Promise<void> {
    try {
      await this.startConnection();
      await this.joinSpaceGroup(spaceId);
    } catch (error) {
      console.error('Error connecting to space:', error);
      throw error;
    }
  }
}