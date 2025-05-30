import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { NgForOf } from '@angular/common';
import { Anomaly, AnomalyService } from '../../../service/anomaly.service';

@Component({
    selector: 'app-ec2-stopped-instance',
    templateUrl: './ec2-stopped-instance.component.html',
    standalone: true,
    imports: [NgChartsModule, NgForOf],
    styleUrls: ['./ec2-stopped-instance.component.scss']
})

export class Ec2StoppedInstanceComponent implements OnInit {
    @Input() anomalyName: string = 'AWS EC2 Instances Running in Stopped State for Too Long';
    anomalies: Anomaly[] = [];
    errorMessage: string = '';
    loading: boolean = false;
    selectedInstance: Anomaly | null = null;


    constructor(private anomalyService: AnomalyService) {}

    ngOnInit(): void {
        if (this.anomalyName && this.anomalyName.trim().length > 0) {
            this.loadAnomalies();
        } else {
            this.errorMessage = "Aucun type d'anomalie spécifié.";
        }
    }

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies(this.anomalyName).subscribe({
            next: (response) => {
                this.anomalies = response.data;
                this.updateChartData();
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message;
                this.loading = false;
            }
        });
    }

    // Statistiques calculées
    get numberOfInstances(): number {
        return this.anomalies.length;
    }

    get numberOfVolumes(): number {
        return this.anomalies.reduce((sum, anomaly) => sum + (anomaly.details?.volumes?.length || 0), 0);
    }

    get underutilizedCount(): number {
        return this.anomalies.filter(anomaly => {
            const daysMatch = anomaly.alert.match(/arrêtée depuis (\d+) jours/);
            const daysStopped = daysMatch ? parseInt(daysMatch[1], 10) : 0;
            return daysStopped > 30;
        }).length;
    }

    get totalVolumeSize(): number {
        return this.anomalies.reduce((sum, anomaly) => {
            const volumes = anomaly.details?.volumes || [];
            return sum + volumes.reduce((volSum, vol) => volSum + (vol.size || 0), 0);
        }, 0);
    }

    barChartType: ChartType = 'bar';
    lineChartType: ChartType = 'line';
    scatterChartType: ChartType = 'scatter';
    doughnutChartType: ChartType = 'doughnut';

    // Total Downtime Trend (Days)
    downtimeTrendOptions: ChartOptions<'line'> = {
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Downtime (Days)' } }, x: { title: { display: true, text: 'Month' } } }
    };
    downtimeTrendData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

    // Scatter Chart: Volume Size vs. Cost per Volume
    scatterChartOptions: ChartOptions<'scatter'> = {
        scales: { x: { title: { display: true, text: 'Volume Size (GiB)' } }, y: { title: { display: true, text: 'Estimated Monthly Cost (USD)' } } }
    };
    scatterChartData: ChartConfiguration<'scatter'>['data'] = { datasets: [] };

    // Volume Size per Instance
    volumeSizeOptions: ChartOptions<'bar'> = {
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Size (GiB)' } }, x: { title: { display: true, text: 'Instance ID' } } }
    };
    volumeSizeData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Volume Size Distribution (Doughnut Chart)
    volumeSizeDistributionOptions: ChartOptions<'doughnut'> = {
        plugins: { legend: { display: true, position: 'bottom' } }
    };
    volumeSizeDistributionData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

    // Mettre à jour les données des graphiques
    updateChartData(): void {
        // Total Downtime Trend
        this.downtimeTrendData = {
            labels: ['Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025'],
            datasets: [
                {
                    label: 'Total Downtime (Days)',
                    data: this.getDowntimeTrendData(),
                    borderColor: '#AB47BC',
                    backgroundColor: '#AB47BC',
                    fill: false
                }
            ]
        };

        // Scatter Chart: Volume Size vs. Cost
        this.scatterChartData = {
            datasets: [
                {
                    label: 'Volume Size vs. Cost',
                    data: this.getScatterData(),
                    backgroundColor: '#FF6384',
                    pointRadius: 8
                }
            ]
        };

        // Volume Size per Instance
        this.volumeSizeData = {
            labels: this.anomalies.map(anomaly => anomaly.details?.instance_id || 'Unknown'),
            datasets: [
                {
                    label: 'Total Volume Size (GiB)',
                    data: this.anomalies.map(anomaly => {
                        const volumes = anomaly.details?.volumes || [];
                        return volumes.reduce((sum, v) => sum + (v.size || 0), 0);
                    }),
                    backgroundColor: ['#FF6384', '#36A2EB']
                }
            ]
        };

        // Volume Size Distribution
        this.volumeSizeDistributionData = {
            labels: this.anomalies.map(anomaly => anomaly.details?.instance_id || 'Unknown'),
            datasets: [
                {
                    label: 'Volume Size Distribution (GiB)',
                    data: this.anomalies.map(anomaly => {
                        const volumes = anomaly.details?.volumes || [];
                        return volumes.reduce((sum, v) => sum + (v.size || 0), 0);
                    }),
                    backgroundColor: ['#42A5F5', '#66BB6A']
                }
            ]
        };
    }

    // Calculer les jours d'arrêt à partir de l'alerte et du timestamp
    getStoppedDaysFromAlert(alert: string, timestamp: string): number {
        const daysMatch = alert.match(/arrêtée depuis (\d+) jours/);
        if (daysMatch) {
            const daysStopped = parseInt(daysMatch[1], 10);
            const timestampDate = new Date(timestamp);
            const stoppedDate = new Date(timestampDate.getTime() - daysStopped * 24 * 60 * 60 * 1000);
            const now = new Date(); // 14:17 CET = 12:17 UTC
            const diffTime = now.getTime() - stoppedDate.getTime();
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    }

    getStoppedSince(alert: string, timestamp: string): string {
        const daysMatch = alert.match(/arrêtée depuis (\d+) jours/);
        if (daysMatch) {
            const daysStopped = parseInt(daysMatch[1], 10);
            const timestampDate = new Date(timestamp);
            const stoppedDate = new Date(timestampDate.getTime() - daysStopped * 24 * 60 * 60 * 1000);
            return stoppedDate.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        }
        return 'N/A';
    }

    calculateEBSMonthlyCost(volumes: any[]): number {
        if (!volumes || volumes.length === 0) return 0;

        let totalCost = 0;
        const pricing = { 'gp3': 0.08, 'io1': 0.125 }; // Prix en USD/GiB/mois en eu-west-1

        for (const volume of volumes) {
            const volumeType = volume.volume_type;
            const size = volume.size || 0;
            const costPerGiB = pricing[volumeType] || 0.08;
            totalCost += size * costPerGiB;
        }

        return totalCost;
    }

    getDowntimeTrendData(): number[] {
        const now = new Date('2025-05-26T12:17:00Z');
        const months = ['Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025'];
        const data: number[] = [];

        months.forEach((month, index) => {
            const monthDate = new Date(2024, 10 + index, 1); // Starting from Nov 2024
            let totalDowntime = 0;

            this.anomalies.forEach(anomaly => {
                const daysMatch = anomaly.alert.match(/arrêtée depuis (\d+) jours/);
                if (daysMatch) {
                    const daysStopped = parseInt(daysMatch[1], 10);
                    const stoppedDate = new Date(anomaly.timestamp);
                    stoppedDate.setDate(stoppedDate.getDate() - daysStopped);

                    if (monthDate >= stoppedDate && monthDate <= now) {
                        const diffTime = Math.abs(now.getTime() - stoppedDate.getTime());
                        const daysSinceStopped = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        totalDowntime += daysSinceStopped;
                    }
                }
            });

            data.push(totalDowntime);
        });

        return data;
    }

    getScatterData(): any[] {
        const data: any[] = [];
        this.anomalies.forEach(anomaly => {
            const volumes = anomaly.details?.volumes || [];
            volumes.forEach((volume: any) => {
                const cost = this.calculateEBSMonthlyCost([volume]);
                data.push({ x: volume.size || 0, y: cost });
            });
        });
        return data;
    }

    getVolumesFromAlert(alert: string): { volumeId: string; type: string; size: number }[] {
        const volumes: { volumeId: string; type: string; size: number }[] = [];
        const volumeRegex = /Volume (vol-[a-f0-9]+) \(Type: (\w+), Size: (\d+) GiB\)/g;
        let match;
        while ((match = volumeRegex.exec(alert)) !== null) {
            volumes.push({ volumeId: match[1], type: match[2], size: parseInt(match[3], 10) });
        }
        return volumes;
    }

    selectInstance(anomaly: Anomaly): void {
        this.selectedInstance = anomaly;
    }
}
