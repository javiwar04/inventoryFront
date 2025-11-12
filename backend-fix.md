# Fix para referencias circulares en Program.cs

Reemplazá esta línea:
```csharp
builder.Services.AddControllers();
```

Por esto:
```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
```

Esto resolverá el error 500 de "object cycle detected" cuando serializa Producto → Categoria → Productos → Categoria...
