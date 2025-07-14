// layout.component.ts
import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SignalRService, LayoutByHour } from '../../Services/signalr.service';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy, OnChanges {
  @Input() spaceId!: number;
  @Input() restaurantId!: number;

  private destroy$ = new Subject<void>();
  private isInitialized = false;
  
  // Layout data
  currentLayout: LayoutByHour[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Connection status
  connectionState = signalR.HubConnectionState.Disconnected;
  isConnected = false;
  
  // Filter and display options
  selectedFilter = 'all';
  viewMode = 'grid'; // 'grid' or 'list'
  
  // Status colors mapping
  statusColors = {
    'None': '#e5e7eb',
    'Reserved': '#fbbf24',
    'Booked': '#10b981',
    'WalkIn': '#8b5cf6',
    'Announced': '#3b82f6',
    'Not_Announced': '#f59e0b',
    'Finished': '#6b7280'
  };

  // Add HubConnectionState enum reference for template
  HubConnectionState = signalR.HubConnectionState;

  constructor(private signalRService: SignalRService) {}

  async ngOnInit(): Promise<void> {
    console.log('ngOnInit - spaceId:', this.spaceId, 'restaurantId:', this.restaurantId);
    
    // Setup subscriptions first
    this.setupSubscriptions();
    
    // Initialize SignalR only if spaceId is available
    if (this.spaceId) {
      await this.initializeSignalR();
    } else {
      console.warn('SpaceId is not available in ngOnInit, waiting for ngOnChanges...');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges:', changes);
    
    // If spaceId changes and we haven't initialized yet, or if spaceId actually changes
    if (changes['spaceId'] && changes['spaceId'].currentValue) {
      const newSpaceId = changes['spaceId'].currentValue;
      console.log('SpaceId changed to:', newSpaceId);
      
      if (!this.isInitialized) {
        // First time initialization
        this.initializeSignalR();
      } else if (changes['spaceId'].previousValue !== newSpaceId) {
        // SpaceId changed, reconnect to new space
        this.reconnectToNewSpace(newSpaceId);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.leaveSpaceGroup();
  }

  private async initializeSignalR(): Promise<void> {
    // Validate inputs
    if (!this.spaceId) {
      this.error = 'Space ID is required';
      console.error('Cannot initialize SignalR: spaceId is missing');
      return;
    }

    try {
      this.isLoading = true;
      console.log('Initializing SignalR for spaceId:', this.spaceId);
      
      // Start connection if not already connected
      if (!this.signalRService.isConnected()) {
        await this.signalRService.startConnection();
      }
      
      // Join space group
      await this.signalRService.joinSpaceGroup(this.spaceId);
      
      this.error = null;
      this.isInitialized = true;
      console.log('SignalR initialized successfully for spaceId:', this.spaceId);
      
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
      this.error = 'Failed to connect to real-time updates';
    } finally {
      this.isLoading = false;
    }
  }

  private async reconnectToNewSpace(newSpaceId: number): Promise<void> {
    try {
      this.isLoading = true;
      console.log('Reconnecting to new space:', newSpaceId);
      
      // Leave current space group if connected
      if (this.signalRService.isConnected()) {
        await this.signalRService.leaveSpaceGroup(this.spaceId);
      }
      
      // Join new space group
      await this.signalRService.joinSpaceGroup(newSpaceId);
      
      // Clear current layout as it's for a different space
      this.currentLayout = [];
      
      this.error = null;
      console.log('Successfully reconnected to space:', newSpaceId);
      
    } catch (error) {
      console.error('Failed to reconnect to new space:', error);
      this.error = 'Failed to connect to new space';
    } finally {
      this.isLoading = false;
    }
  }

  private setupSubscriptions(): void {
    // Connection state changes
    this.signalRService.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.connectionState = state;
        this.isConnected = state === signalR.HubConnectionState.Connected;
        
        if (state === signalR.HubConnectionState.Disconnected) {
          this.error = 'Connection lost. Attempting to reconnect...';
        } else if (state === signalR.HubConnectionState.Connected) {
          this.error = null;
        }
      });

    // Layout updates
    this.signalRService.layoutUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(layout => {
        if (layout && layout.length > 0) {
          this.currentLayout = layout;
          this.sortLayout();
        }
      });

    // New booking created
    this.signalRService.bookingCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(booking => {
        if (booking) {
          this.handleNewBooking(booking);
        }
      });

    // Booking cancelled
    this.signalRService.bookingCancelled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cancelData => {
        if (cancelData) {
          this.handleBookingCancelled(cancelData);
        }
      });

    // New reservation created
    this.signalRService.reservationCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(reservation => {
        if (reservation) {
          this.handleNewReservation(reservation);
        }
      });

    // New walk-in created
    this.signalRService.walkInCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(walkIn => {
        if (walkIn) {
          this.handleNewWalkIn(walkIn);
        }
      });
  }

  private handleNewBooking(booking: LayoutByHour): void {
    // Add to current layout if not already present
    const existingIndex = this.currentLayout.findIndex(
      item => item.tableId === booking.tableId && item.chairId === booking.chairId
    );
    
    if (existingIndex > -1) {
      this.currentLayout[existingIndex] = booking;
    } else {
      this.currentLayout.push(booking);
    }
    
    this.sortLayout();
  }

  private handleBookingCancelled(cancelData: { tableId?: number; chairId?: number }): void {
    // Remove cancelled booking from layout
    this.currentLayout = this.currentLayout.filter(item => {
      if (cancelData.tableId && item.tableId === cancelData.tableId) {
        return false;
      }
      if (cancelData.chairId && item.chairId === cancelData.chairId) {
        return false;
      }
      return true;
    });
  }

  private handleNewReservation(reservation: LayoutByHour): void {
    this.handleNewBooking(reservation); // Same logic as booking
  }

  private handleNewWalkIn(walkIn: LayoutByHour): void {
    this.handleNewBooking(walkIn); // Same logic as booking
  }

  private sortLayout(): void {
    this.currentLayout.sort((a, b) => {
      // Sort by table ID first, then chair ID
      if (a.tableId && b.tableId) {
        if (a.tableId !== b.tableId) {
          return a.tableId - b.tableId;
        }
        if (a.chairId && b.chairId) {
          return a.chairId - b.chairId;
        }
      }
      return 0;
    });
  }

  private async leaveSpaceGroup(): Promise<void> {
    if (this.signalRService.isConnected() && this.spaceId) {
      try {
        await this.signalRService.leaveSpaceGroup(this.spaceId);
      } catch (error) {
        console.error('Error leaving space group:', error);
      }
    }
  }

  // UI Methods
  getFilteredLayout(): LayoutByHour[] {
    if (this.selectedFilter === 'all') {
      return this.currentLayout;
    }
    return this.currentLayout.filter(item => item.status === this.selectedFilter);
  }

  getStatusColor(status: string): string {
    return this.statusColors[status as keyof typeof this.statusColors] || '#e5e7eb';
  }

  getItemTitle(item: LayoutByHour): string {
    if (item.tableId && item.chairId) {
      return `Table ${item.tableId} - Chair ${item.chairId}`;
    } else if (item.tableId) {
      return `Table ${item.tableId}`;
    } else if (item.spaceId) {
      return `Space ${item.spaceId}`;
    }
    return 'Unknown';
  }

  getItemSubtitle(item: LayoutByHour): string {
    return `Status: ${item.status}`;
  }

  onFilterChange(event: Event | string): void {
    if (typeof event === 'string') {
      this.selectedFilter = event;
    } else {
      const target = event.target as HTMLSelectElement;
      this.selectedFilter = target.value;
    }
  }

  onViewModeChange(mode: string): void {
    this.viewMode = mode;
  }

  async reconnect(): Promise<void> {
    if (!this.spaceId) {
      this.error = 'Cannot reconnect: Space ID is missing';
      return;
    }

    try {
      this.isLoading = true;
      this.error = null;
      
      await this.signalRService.stopConnection();
      await this.signalRService.startConnection();
      await this.signalRService.joinSpaceGroup(this.spaceId);
      
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.error = 'Failed to reconnect';
    } finally {
      this.isLoading = false;
    }
  }

  // Utility methods
  getUniqueStatuses(): string[] {
    const statuses = new Set(this.currentLayout.map(item => item.status));
    return Array.from(statuses);
  }

  getStatusCount(status: string): number {
    return this.currentLayout.filter(item => item.status === status).length;
  }

  // Debug method - you can remove this in production
  debugInfo(): void {
    console.log('Debug Info:', {
      spaceId: this.spaceId,
      restaurantId: this.restaurantId,
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      currentLayout: this.currentLayout.length
    });
  }
}