-- 1. Check which tables actually exist in the database
SELECT name, create_date, modify_date 
FROM sys.tables 
WHERE name LIKE 'InventarioPorHotel%';

-- 2. Check content of the SINGULAR table (User verified this one has 10)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InventarioPorHotel')
BEGIN
    SELECT 'Source: InventarioPorHotel (Singular)' as CheckSource, p.Nombre, i.* 
    FROM InventarioPorHotel i
    JOIN Productos p ON i.ProductoId = p.Id
    WHERE p.Nombre LIKE '%Tshirt gris JAGUARES%';
END

-- 3. Check content of the PLURAL table (The C# Code is using this one)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InventarioPorHoteles')
BEGIN
    SELECT 'Source: InventarioPorHoteles (Plural)' as CheckSource, p.Nombre, i.* 
    FROM InventarioPorHoteles i
    JOIN Productos p ON i.ProductoId = p.Id
    WHERE p.Nombre LIKE '%Tshirt gris JAGUARES%';
END
