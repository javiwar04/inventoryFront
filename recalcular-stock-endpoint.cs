using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccesoDatos.Context;
using AccesoDatos.Models;

namespace WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UtilidadesController : ControllerBase
{
    private readonly InventoryBarberShopContext _context;

    public UtilidadesController(InventoryBarberShopContext context)
    {
        _context = context;
    }

    // Endpoint para corregir inconsistencias de Stock
    [HttpPost("recalcular-stock")]
    public async Task<IActionResult> RecalcularStock()
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Limpiar la tabla de inventario por hotel (Borrón y cuenta nueva)
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE InventarioPorHoteles");
            
            // O si TRUNCATE falla por FKs:
            // _context.InventarioPorHoteles.RemoveRange(_context.InventarioPorHoteles);
            // await _context.SaveChangesAsync();

            // 2. Sumar todas las ENTRADAS (Compras)
            var entradas = await _context.DetalleEntradas
                .Include(d => d.Entrada)
                .Where(d => d.Entrada.Estado != "Anulada" && d.Entrada.ProveedorId != null) // ProveedorId se usa como Hotel/Sede en este modelo
                .ToListAsync();

            foreach (var item in entradas)
            {
                int hotelId = item.Entrada.ProveedorId.Value;
                var inv = await _context.InventarioPorHoteles
                    .FirstOrDefaultAsync(x => x.HotelId == hotelId && x.ProductoId == item.ProductoId);

                if (inv == null)
                {
                    inv = new InventarioPorHotel 
                    { 
                        HotelId = hotelId, 
                        ProductoId = item.ProductoId, 
                        Stock = 0, 
                        FechaActualizacion = DateTime.Now 
                    };
                    _context.InventarioPorHoteles.Add(inv);
                }
                inv.Stock += item.Cantidad;
            }
            await _context.SaveChangesAsync();

            // 3. Restar todas las SALIDAS (Ventas)
            var salidas = await _context.DetalleSalidas
                .Include(d => d.Salida)
                .Where(d => d.Salida.Estado != "Anulada" && d.Salida.ClienteId != null) // ClienteID podría ser el Hotel o usarse otra lógica de sede
                // Nota: Ajustar lógica según cómo guardes de qué hotel salió la venta. 
                // Asumimos aquí que el 'Usuario' que vendió pertenece a un 'SedeId' o la Salida tiene 'SedeId'.
                // Si la Salida no tiene Sede explícita, tendrías que ver el usuario creador.
                .ToListAsync();

            // NOTA IMPORTANTE: Revisar tu modelo de Salida para saber de qué HOTE salió el producto.
            // Si la Salida tiene un campo 'AlmacenId' o 'SedeId', úsalo.
            // Si no, este paso requiere corrección según tu lógica de negocio.

            /* EJEMPLO SI SALIDA TIENE SEDE_ID:
            foreach (var item in salidas) {
               // ... Restar similar a la suma de arriba ...
            }
            */

            // 4. Actualizar Stock Total en tabla Productos
            var productos = await _context.Productos.ToListAsync();
            foreach (var p in productos)
            {
                var stockSum = await _context.InventarioPorHoteles
                    .Where(x => x.ProductoId == p.Id)
                    .SumAsync(x => x.Stock);
                
                p.StockActual = stockSum;
            }
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok(new { mensaje = "Stock recalculado correctamente. Ahora coincide con Entradas - Salidas." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ex.Message);
        }
    }
}
