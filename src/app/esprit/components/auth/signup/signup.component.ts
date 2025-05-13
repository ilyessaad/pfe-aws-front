import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/esprit/service/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styles: [`
      :host ::ng-deep .pi-eye,
      :host ::ng-deep .pi-eye-slash {
          transform:scale(1.6);
          margin-right: 1rem;
          color: var(--primary-color) !important;
      }
  `]
})
export class SignupComponent {

  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';
  form: FormGroup;
  showClientForm: boolean = false; // Déclaration et initialisation de showClientForm à false

  constructor(private fb: FormBuilder,private userService: UserService, private router: Router) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  creerCompte() {
    if (this.form.valid) {
      const formData = new FormData();

      // Ajout des champs généraux
      formData.append('nom', this.form.value.nom);
      formData.append('email', this.form.value.email);
      formData.append('password', this.form.value.password);
      formData.append('confirmPassword', this.form.value.confirmPassword);


      this.userService.createAcount(formData).subscribe(
        res => {
          console.log("User registrated successful")
            Swal.fire({
              icon: 'success',
              title: 'Vous êtes inscrit',
              showConfirmButton: false,
              timer: 1500
            });
            this.router.navigate(['/']);

        },
        error => {
          console.log("error")

        }
      );
    }
  }


  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ image: file });
    }
  }


  navigateToPartnerSignup(): void {
    this.router.navigateByUrl('/signupPartenaire');
  }
}
