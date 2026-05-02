export enum ProviderHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}
export enum TimeWindow {
  M5 = '5m',
  H1 = '1h',
  H24 = '24h',
  D7 = '7d',
  D30 = '30d',
}
export interface ProviderHealthResponse {}
export interface AllProvidersHealthResponse {}
export type ProviderName = string
export interface ProviderHealthData {}
