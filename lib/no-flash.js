// Script para prevenir flash de contenido sin estilos (FOUC)
(function() {
  // Prevenir el flash inicial estableciendo estilos inmediatamente
  const style = document.createElement('style');
  style.innerHTML = `
    * { 
      visibility: hidden; 
    }
    .no-fouc { 
      visibility: visible !important; 
    }
  `;
  document.head.appendChild(style);
  
  // Remover el estilo una vez que todo esté listo
  window.addEventListener('load', function() {
    document.body.classList.add('no-fouc');
    setTimeout(() => {
      style.remove();
    }, 100);
  });
})();