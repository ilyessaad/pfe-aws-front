import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { NgForOf } from '@angular/common';
import {
    Anomaly,
    AnomalyService,
    AnomalyResponse,
    AnomalyErrorResponse,
    AnomalySuccessResponse
} from '../../../service/anomaly.service';

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
            next: (response: AnomalyResponse) => {
                if (response.status === 'success') {
                    this.anomalies = (response as AnomalySuccessResponse).data;
                    this.updateChartData();
                } else {
                    const errorResponse = response as AnomalyErrorResponse;
                    this.errorMessage = errorResponse.message;
                }
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message;
                this.loading = false;
            }
        });
    }

    get numberOfInstances(): number {
        return this.anomalies.length;
    }

    get numberOfVolumes(): number {
        return this.anomalies.reduce((sum, anomaly) => sum + (anomaly.details?.volumes?.length || 0), 0);
    }

    get underutilizedCount(): number {
        return this.anomalies.filter(anomaly => {
            const daysMatch = anomaly.alert.match(/stopped for (\d+) days/);
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
    scatterChartType: ChartType = 'scatter';
    doughnutChartType: ChartType = 'doughnut';

    volumeTypeCountOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Volumes' },
                ticks: { stepSize: 1 } // Forcer un pas de 1 pour des valeurs entières
            },
            x: { title: { display: true, text: 'Volume Type' } }
        }
    };
    volumeTypeCountData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    scatterChartOptions: ChartOptions<'scatter'> = {
        scales: {
            x: { title: { display: true, text: 'Volume Size (GiB)' } },
            y: { title: { display: true, text: 'Estimated Monthly Cost (USD)' } }
        }
    };
    scatterChartData: ChartConfiguration<'scatter'>['data'] = { datasets: [] };

    volumeSizeOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Size (GiB)' } },
            x: { title: { display: true, text: 'Instance ID' } }
        }
    };
    volumeSizeData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    volumeSizeDistributionOptions: ChartOptions<'doughnut'> = {
        plugins: { legend: { display: true, position: 'bottom' } }
    };
    volumeSizeDistributionData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

    updateChartData(): void {
        this.volumeTypeCountData = {
            labels: this.getVolumeTypeCountData().labels,
            datasets: [
                {
                    label: 'Number of Volumes by Type',
                    data: this.getVolumeTypeCountData().counts,
                    backgroundColor: ['#66bb74', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }
            ]
        };

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

    getStoppedDaysFromAlert(alert: string, timestamp: string): number {
        const daysMatch = alert.match(/stopped for (\d+) days/);
        if (daysMatch) {
            const daysStopped = parseInt(daysMatch[1], 10);
            const timestampDate = new Date(timestamp);
            const stoppedDate = new Date(timestampDate.getTime() - daysStopped * 24 * 60 * 60 * 1000);
            const now = new Date();
            const diffTime = now.getTime() - stoppedDate.getTime();
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    }

    getStoppedSince(alert: string, timestamp: string): string {
        const daysMatch = alert.match(/stopped for (\d+) days/);
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
        const pricing = {
            'gp3': 0.08,
            'gp2': 0.10,
            'io1': 0.125,
            'standard': 0.05,
            'default': 0.10
        };

        for (const volume of volumes) {
            const volumeType = volume.volume_type;
            const size = volume.size || 0;
            const costPerGiB = pricing[volumeType] || pricing['default'];
            totalCost += size * costPerGiB;
        }

        return totalCost;
    }

    getVolumeTypeCountData(): { labels: string[], counts: number[] } {
        const volumeTypeCounts: { [key: string]: number } = {};

        this.anomalies.forEach(anomaly => {
            const volumes = anomaly.details?.volumes || [];
            volumes.forEach((volume: any) => {
                const volumeType = volume.volume_type || 'Unknown';
                volumeTypeCounts[volumeType] = (volumeTypeCounts[volumeType] || 0) + 1;
            });
        });

        const labels = Object.keys(volumeTypeCounts);
        const counts = Object.values(volumeTypeCounts);

        return { labels, counts };
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
        const volumeRegex = /Volume (vol-[a-f0-9]+) \(Type: (\w+), Size: (\d+) GiB\) is attached\./g;
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
