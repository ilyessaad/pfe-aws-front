import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(public layoutService: LayoutService) { }

    ngOnInit() {
        const userRole = localStorage.getItem('userRole');

        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                    { label: 'Users', icon: 'pi pi-fw pi-user', routerLink: ['/list_users'] }
                ]
            },


            {
                label: 'Anomalies',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    {
                        label: 'EC2',
                        icon: 'pi pi-server',
                        items: [
                            {
                                label: 'ec2 stopped instance',
                               // icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/ec2/stopped_instance']
                            },
                            {
                                label: 'ec2 reserved instance',
                                // icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/ec2/reserved_ins']
                            },
                            {
                                label: 'ec2 check generation',
                                // icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/ec2/check_gen']
                            },

                        ]

                    },

                    {
                        label: 'AWS Budget',
                        icon: 'pi pi-wallet',
                        items: [
                            {
                                label: 'Audit-budget',

                                routerLink: ['/budget/audit']
                            },


                        ]

                    },
                    {
                        label: 'AWS DynamoDB',
                        icon: 'pi pi-box',
                        items: [
                            {
                                label: 'Idle',
                                //
                                routerLink: ['/dynamoDB/idle']
                            },



                        ]

                    },
                    {
                        label: 'AWS EKS',
                        icon: 'pi pi-sitemap',
                        items: [
                            {
                                label: 'Extended support',
                                //
                                routerLink: ['/eks/extended_supp']
                            },


                        ]

                    },
                    {
                        label: 'AWS Elastic IP',
                        icon: 'pi pi-globe',
                        items: [
                            {
                                label: 'Not attached',
                                //
                                routerLink: ['/elasticIp/attached']
                            },


                        ]

                    },
                    {
                        label: 'AWS RDS',
                        icon: 'pi pi-database',
                        items: [
                            {
                                label: 'Extended support',
                                //
                                routerLink: ['/rds/extended_supp']
                            },
                            {
                                label: 'Replicas',
                                // icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/rds/replicas']
                            },
                            {
                                label: 'Stopped instance',
                                // icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/rds/stopped']
                            },


                        ]

                    },




                ]
            },
            //     {
            //         label: 'Hierarchy',
            //         items: [
            //             {
            //                 label: 'Submenu 1', icon: 'pi pi-fw pi-bookmark',
            //                 items: [
            //                     {
            //                         label: 'Submenu 1.1', icon: 'pi pi-fw pi-bookmark',
            //                         items: [
            //                             { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                             { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
            //                             { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' },
            //                         ]
            //                     },
            //                     {
            //                         label: 'Submenu 1.2', icon: 'pi pi-fw pi-bookmark',
            //                         items: [
            //                             { label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }
            //                         ]
            //                     },
            //                 ]
            //             },
            //             {
            //                 label: 'Submenu 2', icon: 'pi pi-fw pi-bookmark',
            //                 items: [
            //                     {
            //                         label: 'Submenu 2.1', icon: 'pi pi-fw pi-bookmark',
            //                         items: [
            //                             { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                             { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' },
            //                         ]
            //                     },
            //                     {
            //                         label: 'Submenu 2.2', icon: 'pi pi-fw pi-bookmark',
            //                         items: [
            //                             { label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' },
            //                         ]
            //                     },
            //                 ]
            //             }
            //         ]
            //     },
            //     {
            //         label: 'Get Started',
            //         items: [
            //             {
            //                 label: 'Documentation', icon: 'pi pi-fw pi-question', routerLink: ['/documentation']
            //             },
            //             {
            //                 label: 'View Source', icon: 'pi pi-fw pi-search', url: ['https://github.com/primefaces/sakai-ng'], target: '_blank'
            //             }
            //         ]
            //     }
        ];

        // if (userRole === 'admin') {
        //     this.model.splice(2, 0, {
        //         label: 'Service',
        //         items: [
        //             { label: 'Services', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/service'] }
        //         ]
        //     });

        //     this.model.splice(5, 0, {
        //         label: 'Commandes',
        //         items: [
        //             { label: 'Commandes', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/orders'] }
        //         ]
        //     });
        // } else if (userRole === 'client'){
        //     this.model.splice(2, 0, {
        //         label: 'Mes Commandes',
        //         items: [
        //             { label: 'Mes Commandes', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/commandes'] }
        //         ]
        //     });
        // }
    }
}
