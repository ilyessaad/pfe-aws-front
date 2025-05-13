import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, debounceTime } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
    subscription!: Subscription;

    constructor(public layoutService: LayoutService) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(25))
            .subscribe(() => {});
    }

    ngOnInit() {
        // Préparer l'affichage des utilisateurs AWS
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
