using AccesoDatos.Context;
using AccesoDatos.Models;
using AccesoDatos.Operaciones;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalidasController : ControllerBase
{
    private readonly SalidaDAO _salidas;
    private readonly MovimientosStockDAO _movimientos;
    private readonly InventoryBarberShopContext _context;

    public SalidasController(SalidaDAO salidas, MovimientosStockDAO movimientos, InventoryBarberShopContext context)
    {
        _salidas = salidas;
        _movimientos = movimientos;
        _context = context;
    }

    #region GET
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Salida>> Get(int id)
    {
        var item = await _salidas.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("numero/{numero}")]
    public async Task<ActionResult<Salida>> GetPorNumero(string numero)
    {
        var item = await _salidas.GetByNumeroAsync(numero);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("fecha/{fecha}")]
    public async Task<ActionResult<IEnumerable<Salida>>> GetPorFecha(DateOnly fecha)
    {
        var list = await _salidas.GetByFechaAsync(fecha);
        return Ok(list);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Salida>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var list = await _salidas.GetPagedAsync(page, pageSize);
        return Ok(list);
    }
    #endregion

    #region POST
    [HttpPost]
    public async Task<ActionResult<Salida>> Crear([FromBody] SalidaCreateDto dto)
    {
        if (dto == null || dto.Detalles == null || !dto.Detalles.Any())
            return BadRequest("Debe incluir al menos un detalle");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Identificar Hotel/Sede de Origen
            int? hotelId = null;
            if (!string.IsNullOrEmpty(dto.Destino))
            {
                // Asumimos que 'Destino' guarda el Nombre del Hotel
                var hotel = await _context.Proveedores.FirstOrDefaultAsync(p => p.Nombre == dto.Destino.Trim());
                if (hotel != null) hotelId = hotel.Id;
            }

            // 2. Validar y Descontar Stock por Hotel - Agrupado
            if (hotelId.HasValue)
            {
                // Agrupamos por producto para descontar el total exacto de una vez
                var movimientosAgrupados = dto.Detalles
                    .GroupBy(d => d.ProductoId)
                    .Select(g => new { ProductoId = g.Key, CantidadTotal = g.Sum(x => x.Cantidad) });

                foreach (var item in movimientosAgrupados)
                {
                    var invHotel = await _context.InventarioPorHoteles
                        .FirstOrDefaultAsync(x => x.HotelId == hotelId.Value && x.ProductoId == item.ProductoId);

                    if (invHotel == null || invHotel.Stock < item.CantidadTotal)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest($"Stock insuficiente en '{dto.Destino}'. Disponible: {invHotel?.Stock ?? 0}");
                    }

                    invHotel.Stock -= item.CantidadTotal;
                    invHotel.FechaActualizacion = DateTime.Now;
                }
                await _context.SaveChangesAsync();
            }

            // 3. Crear Salida
            var salida = new Salida
            {
                NumeroSalida = dto.NumeroSalida.Trim(),
                FechaSalida = dto.FechaSalida,
                Motivo = dto.Motivo.Trim(),
                Destino = dto.Destino?.Trim(),
                Referencia = dto.Referencia?.Trim(),
                Observaciones = dto.Observaciones?.Trim(),
                Estado = dto.Estado.Trim(),
                CreadoPor = dto.CreadoPor,
                FechaCreacion = DateTime.Now
            };

            foreach (var detDto in dto.Detalles)
            {
                salida.DetalleSalida.Add(new DetalleSalida
                {
                    ProductoId = detDto.ProductoId,
                    Cantidad = detDto.Cantidad,
                    Lote = detDto.Lote?.Trim()
                });
            }
            var creado = await _salidas.AddAsync(salida);

            // 4. ACTUALIZAR STOCK GLOBAL (Recalcular suma total)
            // Usamos SQL Directo para asegurar el mapeo correcto a 'stock_actual'
            foreach (var det in dto.Detalles)
            {
                var stockTotal = await _context.InventarioPorHoteles
                    .Where(x => x.ProductoId == det.ProductoId)
                    .SumAsync(x => x.Stock);

                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE productos SET stock_actual = {0} WHERE id = {1}", 
                    stockTotal, det.ProductoId);
            }
            // await _context.SaveChangesAsync();

            // 5. Registrar Movimientos
            foreach (var det in creado.DetalleSalida)
            {
                await _movimientos.RegistrarMovimientoAsync(
                    productoId: det.ProductoId,
                    tipoMovimiento: "salida",
                    cantidad: det.Cantidad,
                    referenciaId: creado.Id,
                    referenciaTipo: "Salida",
                    usuarioId: dto.CreadoPor,
                    lote: det.Lote,
                    fechaVencimiento: null,
                    observaciones: $"Salida {dto.NumeroSalida} - {dto.Motivo} - Sede: {dto.Destino}"
                );
            }

            await transaction.CommitAsync();
            return CreatedAtAction(nameof(Get), new { id = creado.Id }, creado);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion

    #region PUT
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] Salida salida)
    {
        if (id != salida.Id) return BadRequest("Id mismatch");
        var ok = await _salidas.UpdateAsync(salida);
        return ok ? NoContent() : NotFound();
    }
    #endregion

    #region DELETE (CORREGIDO)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Obtener la salida con detalles
            var salida = await _context.Salidas
                .Include(s => s.DetalleSalida)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (salida == null) return NotFound();

            // 2. RECUPERAR EL STOCK (SUMAR LO QUE SE HABÍA RESTADO)
            // Identificar el Hotel de origen basado en el campo 'Destino'
            int? hotelId = null;
            if (!string.IsNullOrEmpty(salida.Destino))
            {
                var hotel = await _context.Proveedores.FirstOrDefaultAsync(p => p.Nombre == salida.Destino);
                if (hotel != null) hotelId = hotel.Id;
            }

            if (hotelId.HasValue)
            {
                foreach (var detalle in salida.DetalleSalida)
                {
                    // Buscar inventario del hotel
                    var invHotel = await _context.InventarioPorHoteles
                        .FirstOrDefaultAsync(x => x.HotelId == hotelId.Value && x.ProductoId == detalle.ProductoId);

                    if (invHotel != null)
                    {
                        invHotel.Stock += detalle.Cantidad; // Devuelve el stock
                        invHotel.FechaActualizacion = DateTime.Now;
                    }
                    else
                    {
                        // Si por alguna razón extraña se borró el registro del hotel, lo recreamos
                        _context.InventarioPorHoteles.Add(new InventarioPorHotel
                        {
                            HotelId = hotelId.Value,
                            ProductoId = detalle.ProductoId,
                            Stock = detalle.Cantidad,
                            FechaActualizacion = DateTime.Now
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            // 3. ACTUALIZAR STOCK GLOBAL FINAL
            foreach (var detalle in salida.DetalleSalida)
            {
                 var stockTotal = await _context.InventarioPorHoteles
                        .Where(x => x.ProductoId == detalle.ProductoId)
                        .SumAsync(x => x.Stock);

                 await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE productos SET stock_actual = {0} WHERE id = {1}", 
                    stockTotal, detalle.ProductoId);
            }
            // await _context.SaveChangesAsync();

            // 4. BORRAR FÍSICAMENTE LA SALIDA
            _context.Salidas.Remove(salida);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return NoContent();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion
}
