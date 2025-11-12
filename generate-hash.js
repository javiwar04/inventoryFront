// Script temporal para generar hash bcrypt
// Ejecutar con: node generate-hash.js

const bcrypt = require('bcryptjs');

// CAMBIA ESTA CONTRASEÑA por la que quieras para el usuario admin
const password = 'javier123';

bcrypt.genSalt(10, (err, salt) => {
  if (err) {
    console.error('Error generando salt:', err);
    return;
  }
  
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      console.error('Error generando hash:', err);
      return;
    }
    
    console.log('\n✅ Hash generado exitosamente:\n');
    console.log(hash);
    console.log('\n📋 Copia este hash y ejecuta en SQL Server:\n');
    console.log(`UPDATE usuarios SET password_hash = '${hash}' WHERE usuario = 'admin';\n`);
  });
});
