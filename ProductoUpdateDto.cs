namespace WebApi.DTOs;

public class ProductoUpdateDto
{
    public int Id { get; set; }
    public string SKU { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public int CategoriaId { get; set; }
    public int? ProveedorId { get; set; }
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public string UnidadMedida { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public DateTime? FechaVencimiento { get; set; }
}
