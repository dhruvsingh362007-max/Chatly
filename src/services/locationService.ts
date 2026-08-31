import { authService } from './authService';

/**
 * Haversine formula to compute geodesic distance between two GPS coordinates in meters.
 * Calculated strictly client-side — raw coordinates are NEVER sent to the database or other users.
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Compute bearing angle in degrees (0-360) between two coordinates
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return Math.round(((θ * 180) / Math.PI + 360) % 360);
}

class LocationService {
  private watchId: number | null = null;
  private timerInterval: any = null;
  private lastReportedLat: number | null = null;
  private lastReportedLng: number | null = null;
  private lastReportedTime: number = 0;
  private baseAnchorLat: number | null = null;
  private baseAnchorLng: number | null = null;
  private isTrackingActive: boolean = false;
  private permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported' = 'prompt';
  private listeners: Array<() => void> = [];

  // Movement threshold in meters before updating proximity in Supabase
  private readonly MOVEMENT_THRESHOLD_METERS = 8;
  // Minimum time in ms between updates to prevent flood
  private readonly MIN_UPDATE_INTERVAL_MS = 4000;

  constructor() {
    this.startSessionWatcher();
    this.initAutoTracking();
  }

  private initAutoTracking() {
    authService.subscribe((user) => {
      if (user && user.isDiscoverable && !user.ghostMode) {
        this.startTracking();
      } else {
        this.stopTracking();
      }
    });
  }

  private startSessionWatcher() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const user = authService.getCurrentUser();
      if (!user) return;
      if (user.isDiscoverable && user.locationSessionExpiresAt) {
        if (Date.now() >= user.locationSessionExpiresAt) {
          authService.setDiscoverable(false);
        }
      }
    }, 1000);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  getPermissionState(): 'prompt' | 'granted' | 'denied' | 'unsupported' {
    return this.permissionState;
  }

  isTracking(): boolean {
    return this.isTrackingActive;
  }

  getApproximateDistanceLabel(meters: number): '~20m' | '~40m' | '~60m' | '~80m' | '~100m' {
    if (meters <= 25) return '~20m';
    if (meters <= 45) return '~40m';
    if (meters <= 65) return '~60m';
    if (meters <= 85) return '~80m';
    return '~100m';
  }

  getDistanceCategory(meters: number): { label: '~20m' | '~40m' | '~60m' | '~80m' | '~100m'; pct: number } {
    if (meters <= 25) return { label: '~20m', pct: 28 };
    if (meters <= 45) return { label: '~40m', pct: 45 };
    if (meters <= 65) return { label: '~60m', pct: 62 };
    if (meters <= 85) return { label: '~80m', pct: 78 };
    return { label: '~100m', pct: 90 };
  }

  getRemainingSessionMinutes(): number | null {
    const user = authService.getCurrentUser();
    if (!user || !user.isDiscoverable || !user.locationSessionExpiresAt) {
      return null;
    }
    const diffMs = user.locationSessionExpiresAt - Date.now();
    if (diffMs <= 0) return 0;
    return Math.max(1, Math.round(diffMs / (60 * 1000)));
  }

  /**
   * Starts periodic GPS location tracking via Browser Geolocation API
   */
  startTracking() {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      this.permissionState = 'unsupported';
      this.notify();
      return;
    }

    if (this.watchId !== null) return;

    this.isTrackingActive = true;
    this.notify();

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePositionUpdate(pos),
        (err) => this.handlePositionError(err),
        {
          enableHighAccuracy: true,
          maximumAge: 4000,
          timeout: 15000,
        }
      );
    } catch (err) {
      console.warn('Failed to start geolocation watchPosition:', err);
    }
  }

  /**
   * Stops geolocation tracking
   */
  stopTracking() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTrackingActive = false;
    this.notify();
  }

  private handlePositionUpdate(pos: GeolocationPosition) {
    this.permissionState = 'granted';
    this.notify();

    const { latitude: lat, longitude: lng } = pos.coords;
    const now = Date.now();

    // 1. If first fix, establish base anchor
    if (this.lastReportedLat === null || this.lastReportedLng === null || this.baseAnchorLat === null) {
      this.baseAnchorLat = lat;
      this.baseAnchorLng = lng;
      this.lastReportedLat = lat;
      this.lastReportedLng = lng;
      this.lastReportedTime = now;
      return;
    }

    // 2. Throttle checks by time
    if (now - this.lastReportedTime < this.MIN_UPDATE_INTERVAL_MS) {
      return;
    }

    // 3. Compute geodesic distance moved from previous position
    const distanceMoved = calculateDistanceMeters(
      this.lastReportedLat,
      this.lastReportedLng,
      lat,
      lng
    );

    // 4. If movement exceeds threshold, compute new privacy-safe proximity state
    if (distanceMoved >= this.MOVEMENT_THRESHOLD_METERS) {
      this.lastReportedLat = lat;
      this.lastReportedLng = lng;
      this.lastReportedTime = now;

      const anchorLat = this.baseAnchorLat ?? lat;
      const anchorLng = this.baseAnchorLng ?? lng;

      const totalOffsetFromBase = calculateDistanceMeters(
        anchorLat,
        anchorLng,
        lat,
        lng
      );

      const bearing = calculateBearing(
        anchorLat,
        anchorLng,
        lat,
        lng
      );

      const category = this.getDistanceCategory(totalOffsetFromBase);

      // Push updated privacy-safe polar proximity to Supabase
      authService.updateProfile({
        approximateDistance: category.label,
        radarDistancePct: category.pct,
        radarAngleDeg: bearing,
      });
    }
  }

  private handlePositionError(err: GeolocationPositionError) {
    if (err.code === err.PERMISSION_DENIED) {
      this.permissionState = 'denied';
    }
    this.notify();
  }

  /**
   * Interactive test movement nudge:
   * Shifts distance or rotates angle to immediately verify real-time radar sync
   * across two devices without needing to physically walk down the street.
   */
  async simulateMovementStep(): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const distanceCycle: Array<{ label: '~20m' | '~40m' | '~60m' | '~80m'; pct: number }> = [
      { label: '~20m', pct: 28 },
      { label: '~40m', pct: 45 },
      { label: '~60m', pct: 62 },
      { label: '~80m', pct: 78 },
    ];

    const currentIdx = distanceCycle.findIndex(d => d.label === currentUser.approximateDistance);
    const nextIdx = (currentIdx + 1) % distanceCycle.length;
    const nextDist = distanceCycle[nextIdx];
    const newAngle = (currentUser.radarAngleDeg + 35) % 360;

    await authService.updateProfile({
      approximateDistance: nextDist.label,
      radarDistancePct: nextDist.pct,
      radarAngleDeg: newAngle,
    });
  }

  async requestBrowserLocationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      this.permissionState = 'unsupported';
      this.notify();
      return false;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.permissionState = 'granted';
          this.handlePositionUpdate(pos);
          resolve(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            this.permissionState = 'denied';
          }
          this.notify();
          resolve(false);
        },
        { timeout: 8000 }
      );
    });
  }
}

export const locationService = new LocationService();
