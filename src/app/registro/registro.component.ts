import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NewParticipant, SheetService } from '../sheet.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent {
  readonly form: FormGroup;
  isSubmitting = false;
  hasSubmitError = false;

  constructor(
    private fb: FormBuilder,
    private sheetService: SheetService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      marca: ['', Validators.required],
      nombreEmpresa: ['', Validators.required],
      nombre: ['', Validators.required],
      cargo: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      puntajeDados: [null, [Validators.required, Validators.min(0)]],
      puntajeRaspe: [null, [Validators.required, Validators.min(0)]],
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);

    return !!control && control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.hasSubmitError = false;

    const raw = this.form.getRawValue();
    const entry: NewParticipant = {
      ...raw,
      puntajeDados: Number(raw.puntajeDados),
      puntajeRaspe: Number(raw.puntajeRaspe),
    };

    this.sheetService.submitParticipant(entry).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.isSubmitting = false;
        this.hasSubmitError = true;
      },
    });
  }
}
