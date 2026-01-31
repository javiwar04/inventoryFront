import api from '@/lib/axios';

export interface TransferenciaCreateDto {
  numeroTransferencia: string;
  fechaTransferencia: string;
  hotelOrigenId: number;
  hotelDestinoId: number;
  observaciones?: string;
  creadoPor: number;
  detalles: DetalleTransferenciaCreateDto[];
}

export interface DetalleTransferenciaCreateDto {
  productoId: number;
  cantidad: number;
  lote?: string;
}

export interface TransferenciaListDto {
  id: number;
  numeroTransferencia: string;
  fechaTransferencia: string;
  hotelOrigenId: number;
  hotelOrigenNombre: string;
  hotelDestinoId: number;
  hotelDestinoNombre: string;
  estado: string;
  observaciones: string;
  cantidadProductos: number;
  detalles: DetalleTransferenciaListDto[];
}

export interface DetalleTransferenciaListDto {
  productoId: number;
  productoNombre: string;
  productoSku: string;
  cantidad: number;
  lote?: string;
}

export const transferenciasService = {
  async getAll(page: number = 1, pageSize: number = 20): Promise<TransferenciaListDto[]> {
    const response = await api.get(`/transferencias?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  async getById(id: number): Promise<TransferenciaListDto> {
    const response = await api.get(`/transferencias/${id}`);
    return response.data;
  },

  async create(data: TransferenciaCreateDto): Promise<any> {
    const response = await api.post('/transferencias', data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/transferencias/${id}`);
  }
};
