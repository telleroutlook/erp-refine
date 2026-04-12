// scripts/seed/progress.ts
// Progress tracking and reporting for seed script

import type { PhaseResult, SeedReport } from './types';

export class SeedProgress {
  private currentPhase = '';
  private phaseTotal = 0;
  private phaseDone = 0;
  private phaseErrors = 0;
  private phaseStart = 0;
  private results: PhaseResult[] = [];

  startPhase(name: string, total: number): void {
    if (this.currentPhase) this.endPhase();
    this.currentPhase = name;
    this.phaseTotal = total;
    this.phaseDone = 0;
    this.phaseErrors = 0;
    this.phaseStart = Date.now();
    console.log(`\n--- ${name} (${total} items) ---`);
  }

  tick(success: boolean): void {
    if (success) {
      this.phaseDone++;
    } else {
      this.phaseErrors++;
    }
    // Print progress every 10 items or at completion
    const total = this.phaseDone + this.phaseErrors;
    if (total % 10 === 0 || total === this.phaseTotal) {
      const pct = this.phaseTotal > 0 ? Math.round((total / this.phaseTotal) * 100) : 100;
      process.stdout.write(`\r  ${this.phaseDone}/${this.phaseTotal} done (${this.phaseErrors} errors) ${pct}%`);
    }
  }

  endPhase(): PhaseResult {
    const result: PhaseResult = {
      phase: this.currentPhase,
      created: this.phaseDone,
      skipped: this.phaseErrors,
      errors: [],
      durationMs: Date.now() - this.phaseStart,
    };
    this.results.push(result);
    const secs = (result.durationMs / 1000).toFixed(1);
    console.log(`\n  Completed: ${result.created} created, ${result.skipped} errors (${secs}s)`);
    return result;
  }

  getReport(orgName: string, startedAt: Date): SeedReport {
    if (this.currentPhase) this.endPhase();
    return {
      startedAt,
      completedAt: new Date(),
      org: orgName,
      phases: this.results,
      totalCreated: this.results.reduce((s, r) => s + r.created, 0),
      totalErrors: this.results.reduce((s, r) => s + r.skipped, 0),
    };
  }

  printSummary(reports: SeedReport[]): void {
    console.log('\n\n=== SEED DATA SUMMARY ===');
    for (const report of reports) {
      const duration = report.completedAt
        ? ((report.completedAt.getTime() - report.startedAt.getTime()) / 1000).toFixed(1)
        : '?';
      console.log(`\n  Organization: ${report.org}`);
      console.log(`  Total Created: ${report.totalCreated}`);
      console.log(`  Total Errors: ${report.totalErrors}`);
      console.log(`  Duration: ${duration}s`);
      console.log('  Phases:');
      for (const p of report.phases) {
        const icon = p.skipped > 0 ? '!' : 'v';
        console.log(`    [${icon}] ${p.phase}: ${p.created} created, ${p.skipped} errors (${(p.durationMs / 1000).toFixed(1)}s)`);
      }
    }
    console.log('\n=========================\n');
  }
}
