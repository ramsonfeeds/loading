import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, NgIf],
  template: `
    <section class="loading-overlay" role="status" aria-live="polite">
      <div class="brand-mark">
        <img
          src="images/logo.jpg"
          alt="Ramson Feeds"
          class="logo"
        />
      </div>
      <mat-spinner diameter="44" />
      <div class="copy">
        <h1>Loading Dispatch System...</h1>
        <p *ngIf="!slowServer()">Connecting to server...</p>
        <p *ngIf="slowServer()">Starting server...<br>This may take a few seconds.</p>
      </div>
    </section>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 18px;
      padding: 24px;
      background: #fff;
      color: #1d1f23;
      text-align: center;
    }

    .brand-mark {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 110px;
      height: 110px;

      border-radius: 12px;
      background: white;
    }

    .logo {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        animation: pulse 1.8s ease-in-out infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.97);
            opacity: .85;
        }

        50% {
            transform: scale(1);
            opacity: 1;
        }

        100% {
            transform: scale(0.97);
            opacity: .85;
        }
    }

    .copy {
      display: grid;
      gap: 6px;
      min-height: 68px;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      line-height: 1.2;
    }

    p {
      margin: 0;
      color: #5f6670;
      font-size: 14px;
      line-height: 1.45;
    }

    @media (max-width: 600px) {
      .brand-mark {
        width: 80px;
        height: 80px;
      }

      .copy h1 {
        font-size: 20px;
      }

      .copy p {
        font-size: 13px;
      }
    }

  `]
})
export class LoadingOverlayComponent implements OnInit, OnDestroy {
  readonly slowServer = signal(false);
  private timeoutId: number | undefined;

  ngOnInit(): void {
    this.timeoutId = window.setTimeout(() => this.slowServer.set(true), 5000);
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.timeoutId);
  }
}
