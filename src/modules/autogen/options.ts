export const TEST_INTERVAL_MINUTES = 1;
export const DEFAULT_INTERVAL_MINUTES = 480;
/** Mode uji 1 menit berhenti sendiri setelah sekian artikel (termasuk yang pertama). */
export const TEST_RUNS = 3;

export const INTERVAL_OPTIONS = [
  { minutes: 1, label: "1 menit (uji coba)" },
  { minutes: 60, label: "1 jam" },
  { minutes: 240, label: "4 jam" },
  { minutes: 480, label: "8 jam" },
  { minutes: 720, label: "12 jam" },
  { minutes: 1440, label: "24 jam" },
] as const;

export type AutoGenerateState = {
  enabled: boolean;
  intervalMinutes: number;
  autoPublish: boolean;
  running: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
  testRunsLeft: number;
  serverNow: string;
};
