import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { UserService } from '../esprit/service/user.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import {Observable, of, Subscription, timer} from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AnomalyService, Anomaly, AnomalyResponse } from '../esprit/service/anomaly.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html',
    providers: [MessageService],
})
export class AppTopBarComponent implements OnInit, OnDestroy {
    items!: MenuItem[];
    loggedIn$: Observable<boolean>;
    anomalies: Anomaly[] = [];
    unreadAnomaliesCount = 0;
    showNotificationPanel = false;
    private anomaliesSubscription!: Subscription;
    private pollingSubscription!: Subscription;
    hoveredAnomaly: number | null = null;

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;
    @ViewChild('notificationPanel') notificationPanel!: ElementRef;

    constructor(
        public layoutService: LayoutService,
        private authService: UserService,
        private messageService: MessageService,
        private router: Router,
        private anomalyService: AnomalyService
    ) { }

    ngOnInit(): void {
        this.loggedIn$ = this.authService.isLoggedIn();

        // Charger les anomalies quand l'état de connexion change
        this.loggedIn$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.startAnomalyPolling();
            } else {
                this.stopAnomalyPolling();
            }
        });
    }

    ngOnDestroy(): void {
        this.stopAnomalyPolling();
    }

    startAnomalyPolling(): void {
        // Chargement initial
        this.loadAnomalies();

        // Polling toutes les 60 secondes (ajustable)
        this.pollingSubscription = timer(0, 60000).pipe(
            switchMap(() => this.loadAnomalies())
        ).subscribe();
    }

    stopAnomalyPolling(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
        if (this.anomaliesSubscription) {
            this.anomaliesSubscription.unsubscribe();
        }
    }

    loadAnomalies(): Observable<void> {
        return new Observable(observer => {
            this.anomaliesSubscription = this.anomalyService.getAnomalies('').pipe(
                catchError(error => {
                    console.error('Erreur lors du chargement des anomalies:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les anomalies'
                    });
                    return of(null);
                })
            ).subscribe((response: AnomalyResponse | null) => {
                if (response && response.status === 'success') {
                    this.anomalies = response.data;

                    // Ici vous pourriez ajouter une logique pour compter seulement les non lues
                    this.unreadAnomaliesCount = this.anomalies.length;

                    // Option: afficher une notification pour les nouvelles anomalies
                    this.showNewAnomaliesNotification();
                }
                observer.next();
                observer.complete();
            });
        });
    }

    showNewAnomaliesNotification(): void {
        if (this.unreadAnomaliesCount > 0 && !this.showNotificationPanel) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Nouvelles anomalies',
                detail: `Vous avez ${this.unreadAnomaliesCount} nouvelles anomalies`,
                life: 5000
            });
        }
    }

    toggleNotificationPanel(): void {
        this.showNotificationPanel = !this.showNotificationPanel;
        if (this.showNotificationPanel) {
            // Quand on ouvre le panel, on peut considérer les anomalies comme lues
            this.unreadAnomaliesCount = 0;
        }
    }

    getUserId(): string | null {
        return localStorage.getItem('user_id');
    }

    logout(): void {
        this.authService.logout();
        Swal.fire({
            icon: 'success',
            title: 'Vous êtes déconnecté',
            showConfirmButton: false,
            timer: 1500
        });
        this.router.navigate(['/']);
    }

    onMarkAllAsRead(): void {
        this.unreadAnomaliesCount = 0;
        // Implémentez ici la logique pour marquer toutes les anomalies comme lues
        this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Toutes les anomalies ont été marquées comme lues',
            life: 3000
        });
    }

    onRefreshAnomalies(): void {
        this.loadAnomalies().subscribe(() => {
            this.messageService.add({
                severity: 'info',
                summary: 'Actualisation',
                detail: 'Les anomalies ont été actualisées',
                life: 3000
            });
        });
    }

    // Méthode pour rediriger vers la page correspondante à l'anomalie
    navigateToAnomaly(anomaly: Anomaly): void {
        let route: string | undefined;

        // Mappage entre anomaly_name et les routes définies dans AppRoutingModule
        switch (anomaly.anomaly_name) {
            case 'AWS Audit Budget Notifications':
                route = '/budget/audit';
                break;
            case 'AWS DynamoDB Table Idle':
                route = '/dynamoDB/idle';
                break;
            case 'AWS EC2 Instances Running Older Generation Hardware':
                route = '/ec2/check_gen';
                break;
            case 'AWS EC2 Instances Running in Stopped State for Too Long':
                route = '/ec2/stopped_instance';
                break;
            case 'AWS RDS Read Replicas Not Used':
                route = '/rds/replicas';
                break;
            case 'AWS RDS Instances Stopped':
                route = '/rds/stopped';
                break;
            case 'AWS RDS Extended Support Version':
                route = '/rds/extended_supp';
                break;
            case 'AWS EC2 Reserved Instances Expiring Soon':
                route = '/ec2/reserved_ins';
                break;
            case 'AWS EKS Clusters Extended Support Version':
                route = '/eks/extended_supp';
                break;
            case 'Idle Elastic IP':
                route = '/elasticIp/attached';
                break;
            default:
                console.warn(`No route defined for anomaly: ${anomaly.anomaly_name}`);
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Attention',
                    detail: `Aucune page définie pour l'anomalie : ${anomaly.anomaly_name}`,
                    life: 3000
                });
                return;
        }

        // Rediriger vers la route correspondante et fermer le panneau
        if (route) {
            this.router.navigate([route]);
            this.showNotificationPanel = false;
        }
    }
}
