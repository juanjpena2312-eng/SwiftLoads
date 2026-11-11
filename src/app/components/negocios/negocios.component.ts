import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, arrowBackOutline, createOutline, storefrontOutline } from 'ionicons/icons';

import {
  CategoriasService,
  NegocioInput,
  Restaurante,
  Subcategoria
} from '../../services/categorias.service';

@Component({
  selector: 'app-negocios',
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon],
  templateUrl: './negocios.component.html',
  styleUrls: ['./negocios.component.scss']
})
export class NegociosComponent implements OnInit {
  @Input() usuarioId = 0;
  @Output() volver = new EventEmitter<void>();

  negocios: Restaurante[] = [];
  subcategorias: Subcategoria[] = [];
  formulario: NegocioInput = this.nuevoFormulario();
  imagenArchivo: File | null = null;
  imagenPreview = '';
  negocioEditando: number | null = null;
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  seleccionarImagen(event: Event): void {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];

  if (!archivo) return;

  if (!archivo.type.startsWith('image/')) {
    this.error = 'Selecciona un archivo de imagen válido.';
    input.value = '';
    return;
  }

  if (archivo.size > 5 * 1024 * 1024) {
    this.error = 'La imagen no debe superar los 5 MB.';
    input.value = '';
    return;
  }

  if (this.imagenPreview.startsWith('blob:')) {
    URL.revokeObjectURL(this.imagenPreview);
  }

  this.imagenArchivo = archivo;
  this.imagenPreview = URL.createObjectURL(archivo);
  this.error = '';
}

quitarImagen(): void {
  if (this.imagenPreview.startsWith('blob:')) {
    URL.revokeObjectURL(this.imagenPreview);
  }

  this.imagenArchivo = null;
  this.imagenPreview = '';
  this.formulario.imagen = '';
}
  constructor(
  private categoriasService: CategoriasService,
  private cdr: ChangeDetectorRef
) {
  addIcons({
    addOutline,
    arrowBackOutline,
    createOutline,
    storefrontOutline
  });
}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cargarSubcategorias(), this.cargarNegocios()]);

  }
  async cargarNegocios(): Promise<void> {
  console.log('[DIAGNÓSTICO] Iniciando carga de negocios');

  this.cargando = true;
  this.error = '';

  try {
    const resultado =
      await this.categoriasService.obtenerMisNegocios(this.usuarioId);

    console.log('[DIAGNÓSTICO] Negocios recibidos:', resultado);

    this.negocios = [...resultado];

    console.log('[DIAGNÓSTICO] Total de negocios:', this.negocios.length);

  } catch (error) {
    console.error('[DIAGNÓSTICO] Error cargando negocios:', error);
    this.error = this.mensajeDeError(
      error,
      'No se pudieron cargar tus negocios.'
    );
  } finally {
    this.cargando = false;
    console.log('[DIAGNÓSTICO] Carga finalizada:', this.cargando);
  }
}
  


  editar(negocio: Restaurante): void {
    this.negocioEditando = negocio.id;
    this.formulario = {
      nombre: negocio.nombre,
      descripcion: negocio.descripcion || '',
      imagen: negocio.imagen || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      tiempo_min: negocio.tiempo_min,
      costo_envio: negocio.costo_envio,
      subcategoria_id: negocio.subcategoria_id || 0,
      disponible: Boolean(negocio.disponible)
    };
    this.imagenArchivo = null;
    this.imagenPreview = negocio.imagen
    ? (negocio.imagen.startsWith('http') ? negocio.imagen : `http://localhost:3000/${negocio.imagen}`)
    : '';
    this.error = '';
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.negocioEditando = null;
    this.quitarImagen();
    this.formulario = this.nuevoFormulario();
    this.error = '';

  }
  
async guardar(): Promise<void> {

  // Evitar envíos duplicados
  if (this.guardando) return;

  // Validar usuario
  if (!this.usuarioId) {
    this.error = 'No se pudo identificar al usuario.';
    return;
  }

  // Validar campos de texto
  if (
    !this.formulario.nombre?.trim() ||
    !this.formulario.descripcion?.trim() ||
    !this.formulario.direccion?.trim() ||
    !this.formulario.telefono?.trim() ||
    !this.imagenArchivo
  ) {
    this.error = 'Completa todos los campos obligatorios.';
    return;
  }

  // Validar tipo de negocio
  if (
    !Number.isInteger(Number(this.formulario.subcategoria_id)) ||
    Number(this.formulario.subcategoria_id) <= 0
  ) {
    this.error = 'Selecciona un tipo de negocio válido.';
    return;
  }

  // Validar tiempo estimado
  const tiempo = Number(this.formulario.tiempo_min);

  if (
    !Number.isInteger(tiempo) ||
    tiempo < 1 ||
    tiempo > 240
  ) {
    this.error = 'El tiempo estimado debe estar entre 1 y 240 minutos.';
    return;
  }

  // Validar costo de envío
  const costo = Number(this.formulario.costo_envio);

  if (
    this.formulario.costo_envio === null ||
    !Number.isFinite(costo) ||
    costo < 0
  ) {
    this.error = 'Ingresa un costo de envío válido. No puede ser negativo.';
    return;
  }

  this.guardando = true;
  this.error = '';
  this.mensaje = '';

  try {
    if (this.negocioEditando === null) {

      await this.categoriasService.crearNegocio(
        this.usuarioId,
        this.formulario,
        this.imagenArchivo
      );

      this.mensaje = 'Negocio registrado correctamente.';

    } else {

      await this.categoriasService.actualizarNegocio(
        this.negocioEditando,
        this.usuarioId,
        this.formulario,
        this.imagenArchivo
      );

      this.mensaje = 'Información actualizada correctamente.';
    }

    if (this.imagenPreview.startsWith('blob:')) {
  URL.revokeObjectURL(this.imagenPreview);
}

    // Limpiar formulario
    this.negocioEditando = null;
    this.formulario = this.nuevoFormulario();
    this.imagenArchivo = null;
    this.imagenPreview = '';

   
    // Actualizar lista de negocios
    await this.cargarNegocios();

  } catch (error) {
     console.log("Datos enviados al backend:", this.formulario);
    

    console.error('Error guardando negocio:', error);

    this.error = this.mensajeDeError(
      error,
      'No se pudo guardar el negocio.'
    );

  } finally {

    this.guardando = false;
    this.cdr.detectChanges();
  }
}

  async alternarDisponibilidad(negocio: Restaurante): Promise<void> {
    const actualizado: NegocioInput = {
      nombre: negocio.nombre,
      descripcion: negocio.descripcion || '',
      imagen: negocio.imagen || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      tiempo_min: negocio.tiempo_min,
      costo_envio: negocio.costo_envio,
      subcategoria_id: negocio.subcategoria_id || 0,
      disponible: !Boolean(negocio.disponible)
    };
    this.error = '';
    this.mensaje = '';
    try {
      await this.categoriasService.actualizarNegocio(negocio.id, this.usuarioId, actualizado);
      this.mensaje = actualizado.disponible
        ? 'El negocio ahora está disponible.'
        : 'El negocio se pausó y ya no aparece en el catálogo.';
      await this.cargarNegocios();
    } catch (error) {
      console.error('Error cambiando disponibilidad:', error);
      this.error = this.mensajeDeError(error, 'No se pudo cambiar la disponibilidad.');
    }
  }

  private async cargarSubcategorias(): Promise<void> {
    try {
      const categorias = await this.categoriasService.obtenerCategorias();
      const categoriaIds = categorias
        .map(categoria => categoria.id)
        .filter((id): id is number => typeof id === 'number');
      const grupos = await Promise.all(
        categoriaIds.map(id => this.categoriasService.obtenerSubcategorias(id))
      );
      this.subcategorias = grupos.flat();
    } catch (error) {
      console.error('Error cargando tipos de negocio:', error);
      this.error = this.mensajeDeError(error, 'No se pudieron cargar los tipos de negocio.');
    }
  }

  private nuevoFormulario(): NegocioInput {
    return {
      nombre: '',
      descripcion: '',
      imagen: null,
      direccion: '',
      telefono: '',
      tiempo_min: 30,
      costo_envio: 0,
      subcategoria_id: 0,
      disponible: true
    };
  }

  private mensajeDeError(error: unknown, predeterminado: string): string {
    if (error instanceof HttpErrorResponse && error.error?.mensaje) {
      return error.error.mensaje;
    }
    return predeterminado;
  }
}
