using AccesoDatos.Models;
using AccesoDatos.Operaciones;
using Microsoft.AspNetCore.Mvc;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly UsuarioDAO _usuarios;
    private readonly UsuarioPermisoDAO _usuarioPermisos;

    public UsuariosController(UsuarioDAO usuarios, UsuarioPermisoDAO usuarioPermisos)
    {
        _usuarios = usuarios;
        _usuarioPermisos = usuarioPermisos;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetAll() => Ok(await _usuarios.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Usuario>> Get(int id)
    {
        var user = await _usuarios.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpGet("username/{username}")]
    public async Task<ActionResult<Usuario>> GetByUsername(string username)
    {
        var user = await _usuarios.GetByUsernameAsync(username);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpGet("email/{email}")]
    public async Task<ActionResult<Usuario>> GetByEmail(string email)
    {
        var user = await _usuarios.GetByEmailAsync(email);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpGet("{id:int}/permisos")]
    public async Task<ActionResult<IEnumerable<UsuarioPermiso>>> Permisos(int id)
    {
        var list = await _usuarioPermisos.GetPermisosUsuarioAsync(id);
        return Ok(list);
    }

    #region CREAR USUARIO
    [HttpPost]
    public async Task<ActionResult<Usuario>> Crear([FromBody] UsuarioCreateDto dto)
    {
        // Validar duplicados
        var existeUsuario = await _usuarios.GetByUsernameAsync(dto.Usuario1);
        if (existeUsuario != null)
            return BadRequest("Ya existe un usuario con ese nombre de usuario");

        var existeEmail = await _usuarios.GetByEmailAsync(dto.Email);
        if (existeEmail != null)
            return BadRequest("Ya existe un usuario con ese email");

        // Mapeo manual DTO -> Entidad
        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Usuario1 = dto.Usuario1,
            Email = dto.Email,
            password_hash = dto.PasswordHash,
            Rol = dto.Rol,
            Estado = dto.Estado,
            Avatar = dto.Avatar,
            CreadoPor = dto.CreadoPor,
            SedeId = dto.SedeId, // <--- GUARDAR LA SEDE
            FechaCreacion = DateTime.Now,
            FechaActualizacion = DateTime.Now
        };

        var creado = await _usuarios.AddAsync(usuario);
        return CreatedAtAction(nameof(Get), new { id = creado.Id }, creado);
    }
    #endregion

    #region ACTUALIZAR USUARIO
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] UsuarioUpdateDto dto)
    {
        if (id != dto.Id) return BadRequest("Id mismatch");

        // 1. Obtener el usuario original de la BD para no perder datos
        var usuarioDB = await _usuarios.GetByIdAsync(id);
        if (usuarioDB == null) return NotFound();

        // 2. Actualizar SOLO lo que viene en el DTO
        if (!string.IsNullOrEmpty(dto.Nombre)) usuarioDB.Nombre = dto.Nombre;
        if (!string.IsNullOrEmpty(dto.Usuario1)) usuarioDB.Usuario1 = dto.Usuario1;
        if (!string.IsNullOrEmpty(dto.Email)) usuarioDB.Email = dto.Email;
        if (!string.IsNullOrEmpty(dto.Rol)) usuarioDB.Rol = dto.Rol;
        if (!string.IsNullOrEmpty(dto.Estado)) usuarioDB.Estado = dto.Estado;
        if (dto.Avatar != null) usuarioDB.Avatar = dto.Avatar;
        
        // Si hay nueva contraseña, la actualizamos
        if (!string.IsNullOrEmpty(dto.password_hash)) usuarioDB.password_hash = dto.password_hash;

        // Actualizar Sede
        if (dto.SedeId != null)
        {
            // Solo actualizamos si viene un valor (incluyendo 0 si envías 0 para limpiar)
            usuarioDB.SedeId = dto.SedeId; 
        }

        usuarioDB.FechaActualizacion = DateTime.Now;

        // 3. Guardar cambios
        var ok = await _usuarios.UpdateAsync(usuarioDB);
        return ok ? NoContent() : NotFound();
    }
    #endregion

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var ok = await _usuarios.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/permisos/{permisoId:int}")]
    public async Task<ActionResult<UsuarioPermiso>> AsignarPermiso(int id, int permisoId, [FromQuery] int? asignadoPor = null)
    {
        var item = await _usuarioPermisos.AsignarAsync(id, permisoId, asignadoPor);
        return Ok(item);
    }

    [HttpDelete("{id:int}/permisos/{permisoId:int}")]
    public async Task<IActionResult> RevocarPermiso(int id, int permisoId)
    {
        var ok = await _usuarioPermisos.RevocarAsync(id, permisoId);
        return ok ? NoContent() : NotFound();
    }
}
