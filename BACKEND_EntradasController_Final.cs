using AccesoDatos.Context;
using AccesoDatos.Models;
using AccesoDatos.Operaciones;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EntradasController : ControllerBase
{
    private readonly EntradaDAO _entradas;
    private readonly MovimientosStockDAO _movimientos;
    private readonly InventoryBarberShopContext _context;

    public EntradasController(EntradaDAO entradas, MovimientosStockDAO movimientos, InventoryBarberShopContext context)
    {
        _entradas = entradas;
        _movimientos = movimientos;
        _context = context;
    }

    #region GET
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Entrada>> Get(int id)
    {
        var item = await _entradas.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
    // ... (Otros GET se mantienen igual) ...
    [HttpGet("numero/{numero}")]
    public async Task<ActionResult<Entrada>> GetPorNumero(string numero)
    {
        var item = await _entradas.GetByNumeroAsync(numero);
        return item is null ? NotFound() : Ok(item);
    }
    [HttpGet("fecha/{fecha}")]
    public async Task<ActionResult<IEnumerable<Entrada>>> GetPorFecha(DateOnly fecha)
    {
        var list = await _entradas.GetByFechaAsync(fecha);
        return Ok(list);
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Entrada>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var list = await _entradas.GetPagedAsync(page, pageSize);
        return Ok(list);
    }
    #endregion

    #region POST
    [HttpPost]
    public async Task<ActionResult<Entrada>> Crear([FromBody] EntradaCreateDto dto)
    {
        if (dto == null || dto.Detalles == null || !dto.Detalles.Any())
            return BadRequest("Debe incluir al menos un detalle");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Crear Entrada
            decimal total = dto.Detalles.Sum(d => d.Cantidad * d.PrecioUnitario);
            var entrada = new Entrada
            {
                NumeroEntrada = dto.NumeroEntrada.Trim(),
                FechaEntrada = dto.FechaEntrada,
                ProveedorId = dto.ProveedorId,
                NumeroFactura = dto.NumeroFactura?.Trim(),
                Total = total,
                Observaciones = dto.Observaciones?.Trim(),
                Estado = dto.Estado.Trim(),
                CreadoPor = dto.CreadoPor,
                FechaCreacion = DateTime.Now
            };

            foreach (var detDto in dto.Detalles)
            {
                entrada.DetalleEntrada.Add(new DetalleEntrada
                {
                    ProductoId = detDto.ProductoId,
                    Cantidad = detDto.Cantidad,
                    PrecioUnitario = detDto.PrecioUnitario,
                    Lote = detDto.Lote?.Trim(),
                    FechaVencimiento = detDto.FechaVencimiento
                });
            }

            var creado = await _entradas.AddAsync(entrada);

            // 2. ACTUALIZAR STOCK EN HOTEL (DISTRIBUIDO) - Agrupado para evitar duplicados
            if (dto.ProveedorId != null)
            {
                int hotelId = dto.ProveedorId.Value;
                
                // Agrupamos por producto para sumar cantidades si vienen varias líneas del mismo
                var movimientosAgrupados = dto.Detalles
                    .GroupBy(d => d.ProductoId)
                    .Select(g => new { ProductoId = g.Key, CantidadTotal = g.Sum(x => x.Cantidad) });

                foreach (var item in movimientosAgrupados)
                {
                    var invHotel = await _context.InventarioPorHoteles
                        .FirstOrDefaultAsync(x => x.HotelId == hotelId && x.ProductoId == item.ProductoId);

                    if (invHotel == null)
                    {
                        invHotel = new InventarioPorHotel
                        {
                            HotelId = hotelId,
                            ProductoId = item.ProductoId,
                            Stock = item.CantidadTotal,
                            FechaActualizacion = DateTime.Now
                        };
                        _context.InventarioPorHoteles.Add(invHotel);
                    }
                    else
                    {
                        invHotel.Stock += item.CantidadTotal;
                        invHotel.FechaActualizacion = DateTime.Now;
                    }
                }
                await _context.SaveChangesAsync();
            }

            // 3. ACTUALIZAR STOCK GLOBAL (Suma de todos los hoteles)
            // Usamos SQL Directo para evitar problemas de mapeo con nombres de columnas (snake_case vs PascalCase)
            foreach (var det in dto.Detalles)
            {
                var stockTotal = await _context.InventarioPorHoteles
                    .Where(x => x.ProductoId == det.ProductoId)
                    .SumAsync(x => x.Stock);

                // UPDATE raw directo a la tabla 'productos', columna 'stock_actual'
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE productos SET stock_actual = {0} WHERE id = {1}", 
                    stockTotal, det.ProductoId);
            }
            // No necesitamos SaveChangesAsync aquí si usamos ExecuteSqlRaw, pero el transaction lo maneja.

            // 4. Registrar Movimientos
            foreach (var det in creado.DetalleEntrada)
            {
                await _movimientos.RegistrarMovimientoAsync(
                    productoId: det.ProductoId,
                    tipoMovimiento: "entrada",
                    cantidad: det.Cantidad,
                    referenciaId: creado.Id,
                    referenciaTipo: "Entrada",
                    usuarioId: dto.CreadoPor,
                    lote: det.Lote,
                    fechaVencimiento: det.FechaVencimiento,
                    observaciones: $"Entrada {dto.NumeroEntrada} - Hotel ID: {dto.ProveedorId}"
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
    public async Task<IActionResult> Actualizar(int id, [FromBody] Entrada entrada)
    {
        if (id != entrada.Id) return BadRequest("Id mismatch");
        var ok = await _entradas.UpdateAsync(entrada);
        return ok ? NoContent() : NotFound();
    }
    #endregion

    #region DELETE (CORREGIDO)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        // NO USAR _entradas.DeleteAsync(id) DIRECTAMENTE PORQUE ESO NO DEVUELVE EL STOCK
        
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Obtener la entrada con sus detalles ANTES de borrarla
            var entrada = await _context.Entradas
                .Include(e => e.DetalleEntrada)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrada == null) return NotFound();

            // 2. REVERTIR EL STOCK (RESTAR LO QUE SE HABÍA SUMADO)
            if (entrada.ProveedorId != null) // Si estaba asignada a un hotel/proveedor
            {
                int hotelId = entrada.ProveedorId.Value;
                foreach (var detalle in entrada.DetalleEntrada)
                {
                    // A. Restar del Inventario Por Hotel
                    var invHotel = await _context.InventarioPorHoteles
                        .FirstOrDefaultAsync(x => x.HotelId == hotelId && x.ProductoId == detalle.ProductoId);

                    if (invHotel != null)
                    {
                        invHotel.Stock -= detalle.Cantidad;
                        if (invHotel.Stock < 0) invHotel.Stock = 0; // Evitar negativos
                        invHotel.FechaActualizacion = DateTime.Now;
                    }

                    // B. Restar del Stock Global (Si usas stock global calculado)
                    // Opcional si el global se calcula sumando, pero por seguridad:
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    if (producto != null)
                    {
                         // Recalcular TOTAL REAL basado en la tabla distribuida (post-resta)
                         // Nota: Guardamos invHotel changes antes para que el Sum lo tome
                   }
                }
                await _context.SaveChangesAsync();
            }

            // 3. ACTUALIZAR STOCK GLOBAL FINAL
            foreach (var detalle in entrada.DetalleEntrada)
            {
                 var stockTotal = await _context.InventarioPorHoteles
                        .Where(x => x.ProductoId == detalle.ProductoId)
                        .SumAsync(x => x.Stock);

                 // UPDATE raw directo a 'stock_actual'
                 await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE productos SET stock_actual = {0} WHERE id = {1}", 
                    stockTotal, detalle.ProductoId);
            }
            // await _context.SaveChangesAsync(); // Ya no es necesario para producto, pero sí para el Delete de abajo

            // 4. BORRAR FÍSICAMENTE LA ENTRADA
            _context.Entradas.Remove(entrada);
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
